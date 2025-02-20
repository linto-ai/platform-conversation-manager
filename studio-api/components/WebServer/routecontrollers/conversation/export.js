const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:conversation`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const webSocketSingleton = require(
  `${process.cwd()}/components/WebServer/controllers/llm//llm_ws`,
)

const docx = require(
  `${process.cwd()}/components/WebServer/controllers/export/docx`,
)
const llm = require(
  `${process.cwd()}/components/WebServer/controllers/llm/index`,
)

const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

const { jsonToPlainText } = require("json-to-plain-text")

const {
  ConversationIdRequire,
  ConversationNotFound,
  ConversationMetadataRequire,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

async function listExport(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    let conversationExport = await model.conversationExport.getByConvAndFormat(
      req.params.conversationId,
    )
    if (conversationExport.length === 0) {
      return []
    }

    let list = []
    let done = true
    for (let status of conversationExport) {
      let export_conv = {
        _id: status._id.toString(),
        format: status.format,
        status: status.status,
        jobId: status.jobId,
        processing: status.processing,
        last_update: status.last_update,
      }
      if (!["complete", "error", "unknown"].includes(status.status))
        done = false
      if (status.status === "error") export_conv.error = status.error
      list.push(export_conv)
    }
    if (!done) {
      webSocketSingleton.getSocket() // in case the socket is not initialized
      // we add the list of job to the watching list
      const jobIds = conversationExport
        .filter((convExport) => {
          if (
            convExport.status === "complete" ||
            convExport.status === "error" ||
            convExport.status === "unknown"
          )
            return false
          if (!convExport.jobId) return false
          return true
        })
        .map((convExport) => convExport.jobId)

      webSocketSingleton.sendMessage(jobIds)
    }

    res.status(200).send(list)
  } catch (error) {
    next(error)
  }
}

async function exportConversation(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    if (!req.query.format)
      throw new ConversationMetadataRequire("format is required")

    let conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (conversation.length !== 1) throw new ConversationNotFound()

    conversation = conversation[0]

    let metadata = {}
    metadata = await prepateData(conversation, metadata, req.query.format)
    if (req.body) {
      if (req.body.filter)
        conversation = await prepareConversation(conversation, req.body.filter)
      if (conversation.text.length === 0) {
        res.status(204).send()
        return
      }

      if (req.body.metadata)
        metadata = await prepareMetadata(
          conversation,
          req.body.metadata,
          metadata,
        )
    }

    switch (req.query.format) {
      case "json":
        await handleJsonFormat(res, metadata, conversation)
        break
      case "text":
        await handleTextFormat(res, metadata, conversation)
        break
      case "docx":
      case "verbatim":
        await handleVerbatimFormat(res, req.query, conversation, metadata)
        break
      default:
        await handleLLMService(res, req.query, conversation, metadata)
    }
  } catch (err) {
    next(err)
  }
}

async function callLlmAPI(query, conversation, metadata, conversationExport) {
  llm
    .request(query, conversation, metadata, conversationExport)
    .then((data) => {
      conversationExport.jobId = data
      conversationExport.status = "processing"
      model.conversationExport.update(conversationExport)
    })
    .catch((err) => {
      conversationExport.status = "error"
      conversationExport.error = err.message
      model.conversationExport.update(conversationExport)
    })
}

async function handleLLMService(res, query, conversation, metadata) {
  if (query.flavor === undefined)
    throw new ConversationMetadataRequire("flavor is required")

  let conversationExport = await model.conversationExport.getByConvAndFormat(
    conversation._id,
    query.format,
  )
  if (query.regenerate === "true" || conversationExport.length === 0) {
    if (conversationExport.length !== 0)
      await model.conversationExport.delete(conversationExport[0]._id)
    conversationExport = {
      convId: conversation._id.toString(),
      format: query.format,
      status: "processing",
      processing: 0,
    }
    exportResult = await model.conversationExport.create(conversationExport)
    conversationExport._id = exportResult.insertedId.toString()

    callLlmAPI(query, conversation, metadata, conversationExport)
    res.status(200).send({ status: "processing", processing: 0 })
  } else if (
    conversationExport[0].status === "done" ||
    conversationExport[0].status === "complete"
  ) {
    conversationExport = conversationExport[0]
    const file = await docx.generateDocxOnFormat(query, conversationExport)
    sendFileAsResponse(res, file, query.preview)
  } else {
    if (
      conversationExport[0].status === "unknown" ||
      (conversationExport[0].status === "error" && conversationExport[0].error)
    ) {
      res.status(400).send({
        status: conversationExport[0].status,
        error: conversationExport[0].error,
      })
    } else {
      llm.pollingLlm(conversationExport[0].jobId, conversationExport[0])
      res.status(200).send({
        status: conversationExport[0].status,
        processing: conversationExport[0].processing,
      })
    }
  }
}

async function sendFileAsResponse(res, file, preview = false) {
  const validCharsRegex = /[a-zA-Z0-9-_]/g
  let fileName = file.name.match(validCharsRegex).join("")

  if (preview === "true") {
    const pdf = await docx.convertToPDF(file)
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-disposition", "attachment; filename=" + fileName)
    res.sendFile(pdf.path)
  } else {
    res.setHeader("Content-Type", "application/vnd.openxmlformats")
    res.setHeader("Content-disposition", "attachment; filename=" + fileName)
    res.sendFile(file.path)
  }
}

async function handleJsonFormat(res, metadata, conversation) {
  let output = {
    metadata: metadata,
    text: conversation.text,
  }

  //we don't add metadata if json is empty
  if (Object.keys(metadata).length === 0) delete output.metadata

  res.setHeader("Content-Type", "application/json")
  res.status(200).send(output)
}

async function handleTextFormat(res, metadata, conversation) {
  let output = jsonToPlainText(metadata, {
    color: false,
  })

  output += "\n\n"
  conversation.text.map((text) => {
    if (metadata.speakers) output += `${text.speaker_name} : `
    if (text.stime) output += `${text.stime} - ${text.etime} : `
    output += text.segment + "\n\n"
  })

  res.setHeader("Content-Type", "text/plain")
  res.status(200).send(output)
}

async function handleVerbatimFormat(res, query, conversation, metadata) {
  const text = await llm.generateText(conversation, metadata)
  const conv = {
    data: text,
    status: "done",
    convId: conversation._id,
    format: query.format,
    created: conversation.created,
  }
  const file = await docx.generateDocxOnFormat(query, conv)
  sendFileAsResponse(res, file, query.preview)
}

async function prepareConversation(conversation, filter) {
  if (filter.speaker)
    conversation.text = conversation.text.filter((turn) =>
      filter.speaker.includes(turn.speaker_id),
    )

  if (filter.keyword) {
    keyword_list = filter.keyword.split(",")
    keyword_list = (await model.tags.getByIdList(keyword_list)).map(
      (tag) => tag.name,
    )
    conversation.text = conversation.text.filter((turn) =>
      keyword_list.some((keyword) =>
        turn.segment.toLowerCase().includes(keyword),
      ),
    )
  }
  return conversation
}

async function prepateData(conversation, data, format) {
  data.title = conversation.name
  if (conversation.description) data.description = conversation.description

  let speakers = {}

  data.speakers = []
  conversation.speakers.map((speaker) => {
    speakers[speaker.speaker_id] = speaker.speaker_name
    data.speakers.push(speaker.speaker_name)
  })

  let secondsDecimals = 2
  if (format === "docx") secondsDecimals = 0

  let text = conversation.text.map((turn) => {
    let stime, etime
    if (turn.stime) stime = turn.stime
    else stime = turn.words[0].stime

    if (turn.etime) etime = turn.etime
    else etime = turn.words[turn.words.length - 1].etime

    let update_turn = {
      turn_id: turn.turn_id,
      segment: turn.segment,
    }
    update_turn.speaker_id = turn.speaker_id
    update_turn.speaker_name = speakers[turn.speaker_id]
    update_turn.stime = secondsToHHMMSSWithDecimals(stime, secondsDecimals)
    update_turn.etime = secondsToHHMMSSWithDecimals(etime, secondsDecimals)
    return update_turn
  })

  conversation.text = text
  return data
}

async function prepareMetadata(conversation, metadata, data) {
  if (metadata.tags !== false || metadata.keyword !== false) {
    data.categories = {}

    let conv_tag = await model.tags.getByIdList(conversation.tags)
    for (let tag of conv_tag) {
      let category = await model.categories.getById(tag.categoryId)
      if (!category) continue

      category = category[0]
      if (category.type === TYPE.HIGHLIGHT && metadata.keyword === false)
        continue
      if (category.type === TYPE.LABEL && metadata.tags === false) continue

      if (!data.categories[category.name])
        data.categories[category.name] = { type: category.type, tags: [] }

      data.categories[category.name].tags.push(tag.name)
    }
    if (Object.keys(data.categories).length === 0) delete data.categories
  }

  return data
}

function secondsToHHMMSSWithDecimals(totalSeconds, secondsDecimals = 0) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = (totalSeconds % 60).toFixed(secondsDecimals)

  if (hours === 0) return `${minutes.toString().padStart(2, "0")}:${seconds}`
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds}`
}

module.exports = {
  exportConversation,
  listExport,
}
