const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:keyword",
)
const FormData = require("form-data")

const model = require(`${process.cwd()}/lib/mongodb/models`)
const axios = require(`${process.cwd()}/lib/utility/axios`)

const { KeywordError, KeywordMetadataRequire } = require(
  `${process.cwd()}/components/WebServer/error/exception/keyword`,
)

const { ConversationIdRequire } = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

async function keywordExtract(req, res, next) {
  try {
    if (!req.body.endpoint)
      throw new KeywordMetadataRequire("endpoint param is require")
    if (!req.body.serviceName)
      throw new KeywordMetadataRequire("serviceName param is require")

    if (!req.params.conversationId) throw new ConversationIdRequire()
    let service = process.env.GATEWAY_SERVICES + "/" + req.body.endpoint

    const conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (conversation.length !== 1) throw new ConversationNotFound()

    if (!conversation[0].text || conversation[0].text.length === 0)
      throw new KeywordError("Conversation has no text")

    let documents = []
    let text = ""
    conversation[0].text.map((segText) => {
      segText.segment.split(/\s+/).map((seg) => {
        text += seg + " "
      })
    })
    if (text !== "") documents.push(text)

    let optionsForm = prepareForm(req, documents)

    const job = await axios.postFormData(`${service + "/nlp"}`, optionsForm)

    conversation[0].jobs.keyword = {
      job_id: job.jobid,
      endpoint: req.body.endpoint,
      state: "pending",
      steps: {},
    }

    await model.conversations.updateJob(
      req.params.conversationId,
      conversation[0].jobs,
    )

    res.status(201).send({
      message: "A keyword job is currently being processed",
    })
  } catch (err) {
    next(err)
  }
}

function prepareForm(req, documents) {
  const form = new FormData()
  let nlpConfig = {
    keywordExtractionConfig: {
      enableKeywordExtraction: true,
      serviceName: req.body.serviceName,
      method: "frekeybert",
      methodConfig: { top_n: 10 },
    },
  }
  form.append("nlpConfig", JSON.stringify(nlpConfig))
  form.append("documents", JSON.stringify(documents))

  let options = {
    headers: {
      "Content-Type": "multipart/form-data",
      accept: "application/json",
    },
    formData: form,
    encoding: null,
  }

  return options
}

module.exports = {
  keywordExtract,
}
