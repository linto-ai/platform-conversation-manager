const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:subtitle`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const validator = require(`${process.cwd()}/lib/dao/schema/validator`)

const PUNCTUATION_REGEX = /[,.!?]/
const COMPOSE_WORD_REGEX = /['-]/

const { duration } = require("moment")
const { v4: uuidv4 } = require("uuid")

const {
  ConversationNotFound,
  SubtitleUnsupportedMediaType,
  SubtitleError,
  SubtitleMaxVersion,
  SubtitleNotFound,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

const MAX_CHAR_PER_SEGMENT = 80
const MIN_CHAR_PER_SEGMENT = 20

function splitSubtitles(conv, query) {
  let screenCharSize = undefined
  let screenMaxDuration = undefined

  if (query.screenMaxDuration)
    screenMaxDuration = parseInt(query.screenMaxDuration)
  if (query.screenCharSize) screenCharSize = parseInt(query.screenCharSize)

  if (!screenMaxDuration && !screenCharSize)
    screenCharSize = MAX_CHAR_PER_SEGMENT

  if (screenCharSize <= MIN_CHAR_PER_SEGMENT)
    screenCharSize = MIN_CHAR_PER_SEGMENT

  const segmentMaxSize = screenCharSize + 20
  let subtitle = []
  let words = []
  let stime, etime

  let segment = ""

  conv.text.map((conv_seg) => {
    for (let i = 0; i < conv_seg.words.length; i++) {
      const word = conv_seg.words[i].word

      if (segment === "" || segment === " ") {
        // On new subtitle segment
        stime = conv_seg.words[i].stime
        words = []
      }

      words.push(conv_seg.words[i])
      segment += word + " "
      etime = conv_seg.words[i].etime
      segmentDuration = etime - stime

      // on punctuation mark, split the segment if it's too long
      if (PUNCTUATION_REGEX.test(word)) {
        let lastwords = []
        if (
          segment.length >= screenCharSize ||
          (!!screenMaxDuration && segmentDuration > screenMaxDuration)
        ) {
          const word_segment = segment.split(" ")

          while (segment.length >= screenCharSize) {
            lastwords.push(word_segment.pop())
            segment = word_segment.join(" ").trim()
          }

          const splited_segment = word_segment.join(" ").trim()
          const new_words = words.splice(0, splited_segment.split(" ").length)

          subtitle.push(
            generateScreen(
              splited_segment,
              stime,
              new_words[new_words.length - 1].etime,
              conv_seg.turn_id,
              new_words,
            ),
          )
          segment = lastwords.reverse().join(" ")

          stime = words[0] ? words[0].stime : conv_seg.words[i].stime

          // force cut on punctuation mark if segment reaches maxCharsPerSegment / 2
        }
        if (
          (segment.length >= screenCharSize / 2 ||
            (!!screenMaxDuration && segmentDuration > screenMaxDuration)) &&
          PUNCTUATION_REGEX.test(word)
        ) {
          subtitle.push(
            generateScreen(segment, stime, etime, conv_seg.turn_id, words),
          )
          segment = " " // Allow to add the last segment
        }
      }

      if (
        segment.length > segmentMaxSize ||
        (!!screenMaxDuration && segmentDuration > screenMaxDuration)
      ) {
        // Should not stop on composed word, will add the next word
        if (
          COMPOSE_WORD_REGEX.test(conv_seg.words[i].word) &&
          conv_seg.words[i + 1] !== undefined
        ) {
          i++
          words.push(conv_seg.words[i]) // maybe this have not to be there
          segment += conv_seg.words[i].word + " "
          etime = conv_seg.words[i].etime
        }
        subtitle.push(
          generateScreen(segment, stime, etime, conv_seg.turn_id, words),
        )
        segment = " "
      }
    }

    //last part of the segment
    if (segment.length > 0) {
      subtitle.push(
        generateScreen(segment, stime, etime, conv_seg.turn_id, words),
      )
      segment = ""
    }
  })

  subtitle = subtitle.filter((element) => element !== undefined)

  let screenLines = 1
  if (query.screenLines !== undefined) {
    screenLines = parseInt(query.screenLines)

    if (!isNaN(screenLines) && screenLines > 1) {
      subtitle.map((subtitle) => {
        subtitle.text = splitStringIntoLines(subtitle.text[0], screenLines)
      })
    }
  }

  return {
    generate_settings: {
      screenCharSize,
      screenLines,
    },
    screens: subtitle,
  }
}

function generateScreen(text, stime, etime, id, words) {
  //genere sid here
  let screen = {
    stime,
    etime,
    turn_id: id,
    screen_id: uuidv4(),
  }

  if (Array.isArray(text)) {
    screen.text = segment.trim()
  } else screen.text = [text.trim()]

  if (screen.text[0] === " " || screen.text[0] === "") return undefined

  screen.words = words

  return screen
}

function secondsToSRT(seconds, type = "srt") {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = (seconds % 3600) % 60
  const milliseconds = Math.round(
    (remainingSeconds - Math.floor(remainingSeconds)) * 1000,
  )

  if (type === "srt")
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(Math.floor(remainingSeconds)).padStart(2, "0")},${String(
      milliseconds,
    ).padStart(3, "0")}`

  //otherwise vtt format
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(Math.floor(remainingSeconds)).padStart(2, "0")}.${String(
    milliseconds,
  ).padStart(3, "0")}`
}

function generateSrt(subtitle_data) {
  let srt = ""
  let srt_index = 1
  subtitle_data.map((subtitle) => {
    srt += srt_index++ + "\n"
    srt +=
      secondsToSRT(subtitle.stime, "srt") +
      " --> " +
      secondsToSRT(subtitle.etime, "srt") +
      "\n"
    srt += subtitle.text.join("\n") + "\n\n"
  })
  return srt
}

function generateVtt(subtitle_data) {
  let vtt = "WEBVTT\n\n"
  subtitle_data.map((subtitle) => {
    vtt +=
      secondsToSRT(subtitle.stime, "vtt") +
      " --> " +
      secondsToSRT(subtitle.etime, "vtt") +
      "\n"
    subtitle.text.map((text) => {
      vtt += "- " + text + "\n"
    })
    vtt += "\n"
  })
  return vtt
}

function splitStringIntoLines(inputString, screenLines) {
  const words = inputString.split(/[\s]+/) // Split the string at spaces, periods, commas, semicolons, exclamation marks, and question marks.
  const lineCount = Math.min(screenLines, words.length) // Ensure numbescreenLinesrOfLines is not greater than the number of words.
  const wordsPerLine = Math.ceil(words.length / lineCount)
  const lines = []

  for (let i = 0; i < lineCount; i++) {
    const startIndex = i * wordsPerLine
    const endIndex = startIndex + wordsPerLine
    const line = words.slice(startIndex, endIndex).join(" ")
    lines.push(line)
  }

  return lines
}

async function generateSubtitle(req, res, next) {
  try {
    if (!req.params.conversationId)
      throw new SubtitleUnsupportedMediaType("Conversation id is required")
    if (!req.body.version)
      throw new SubtitleUnsupportedMediaType("Version name is require")

    const conversationId = req.params.conversationId

    const conversation = await model.conversations.getById(conversationId)
    const version_number = await model.conversationSubtitles.getByConvId(
      conversationId,
      { _id: 1 },
    )

    if (conversation.length !== 1) throw new ConversationNotFound()
    else if (
      version_number.length + 1 >
      parseInt(process.env.MAX_SUBTITLE_VERSION)
    )
      throw new SubtitleMaxVersion()

    const conv = conversation[0]
    const conv_subtitle =
      await model.conversationSubtitles.getByConvIdAndVersion(
        conversationId,
        req.body.version,
      )

    let subtitles = splitSubtitles(conversation[0], req.body)
    subtitles = {
      ...subtitles,
      conv_id: conv._id,
      orga_id: conv.organization.organizationId,
      conv_name: conv.name,
      version: req.body.version,
    }
    let result
    if (conv_subtitle.length > 0) {
      subtitles._id = conv_subtitle[0]._id
      result = await model.conversationSubtitles.update(subtitles)
    } else {
      result = await model.conversationSubtitles.create(subtitles)
      subtitles._id = result.insertedId.toString()
    }

    res.status(201).json(subtitles)
  } catch (err) {
    next(err)
  }
}

async function getSubtitle(req, res, next) {
  try {
    const conv_subtitle = await model.conversationSubtitles.getById(
      req.params.subtitleId,
    )

    if (conv_subtitle.length === 0) {
      // If no subtitle exist, we generate it the first time
      throw new SubtitleNotFound()
    } else {
      if (req.query.type === "srt") {
        const srt = generateSrt(conv_subtitle[0].screens)
        res.status(200).send(srt)
      } else if (req.query.type === "vtt") {
        const vtt = generateVtt(conv_subtitle[0].screens)
        res.status(200).send(vtt)
      } else {
        res.status(200).json(conv_subtitle[0])
      }
    }
  } catch (err) {
    next(err)
  }
}

async function updateScreen(req, res, next) {
  try {
    if (!req.params.subtitleId || !req.params.screenId)
      throw new SubtitleUnsupportedMediaType()
    const conv_subtitle = await model.conversationSubtitles.getById(
      req.params.subtitleId,
    )

    if (conv_subtitle.length === 0) {
      // If no subtitle exist, we generate it the first time
      throw new SubtitleNotFound()
    } else {
      if (typeof req.body !== "object" && !req.body.turn_id)
        throw new SubtitleUnsupportedMediaType()

      req.body.screen_id = req.params.screenId
      if (!validator(req.body, "screen"))
        throw new SubtitleUnsupportedMediaType("Screen format is not valid")

      let result = await model.conversationSubtitles.updateScreen(
        req.params.subtitleId,
        req.params.screenId,
        req.body,
      )
      if (result.result && result.result.nModified === 1) res.status(200).send()
      else res.status(304).send()
    }
  } catch (err) {
    next(err)
  }
}

async function addScreen(req, res, next) {
  try {
    if (!req.params.subtitleId || !req.params.screenId)
      throw new SubtitleUnsupportedMediaType()
    const conv_subtitle = await model.conversationSubtitles.getById(
      req.params.subtitleId,
    )

    if (conv_subtitle.length === 0) {
      // If no subtitle exist, we generate it the first time
      throw new SubtitleNotFound()
    } else {
      if (typeof req.body !== "object" && !req.body.turn_id)
        throw new SubtitleUnsupportedMediaType()

      let position = conv_subtitle[0].screens.reduce(
        (index, screen, currentIndex) => {
          return screen.screen_id === req.params.screenId ? currentIndex : index
        },
        0,
      )

      if (req.query.placement === "before") position -= 1
      else position += 1

      req.body.screen_id = uuidv4()
      if (!validator(req.body, "screen"))
        throw new SubtitleUnsupportedMediaType("Screen format is not valid")

      let result = await model.conversationSubtitles.addScreen(
        req.params.subtitleId,
        req.params.screenId,
        req.body,
        position,
      )
      if (result.result && result.result.nModified === 1)
        res.status(200).json({ _id: req.body.screen_id })
      else res.status(304).send()
    }
  } catch (err) {
    next(err)
  }
}

async function deleteScreen(req, res, next) {
  try {
    if (!req.params.subtitleId || !req.params.screenId)
      throw new SubtitleUnsupportedMediaType()
    const conv_subtitle = await model.conversationSubtitles.getById(
      req.params.subtitleId,
    )

    if (conv_subtitle.length === 0) {
      // If no subtitle exist, we generate it the first time
      throw new SubtitleNotFound()
    } else {
      let result = await model.conversationSubtitles.deleteScreen(
        req.params.subtitleId,
        req.params.screenId,
      )
      if (result.result && result.result.nModified === 1) res.status(200).send()
      else res.status(304).send()
    }
  } catch (err) {
    next(err)
  }
}

async function listVersion(req, res, next) {
  try {
    const conv_subtitle = await model.conversationSubtitles.getByConvId(
      req.params.conversationId,
    )

    if (conv_subtitle.length === 0) {
      // If no subtitle exist, we generate it the first time
      res.status(204).send()
    } else {
      let result = conv_subtitle.map((subtitle) => {
        return {
          _id: subtitle._id,
          conv_id: subtitle.conv_id,
          name: subtitle.name,
          version: subtitle.version,
          generate_settings: subtitle.generate_settings,
        }
      })

      res.status(200).json(result)
    }
  } catch (err) {
    next(err)
  }
}

async function updateSubtitle(req, res, next) {
  try {
    const conv_subtitle = await model.conversationSubtitles.getById(
      req.params.subtitleId,
    )
    if (conv_subtitle.length !== 1) throw new SubtitleNotFound()

    const subtitle = {
      _id: req.params.subtitleId,
      ...req.body,
    }

    const result = await model.conversationSubtitles.update(subtitle)
    if (result.matchedCount === 0) throw new SubtitleError()

    res.status(200).send({
      message: "Subtitle updated",
    })
  } catch (err) {
    next(err)
  }
}

async function deleteSubtitle(req, res, next) {
  try {
    const conv_subtitle = await model.conversationSubtitles.getById(
      req.params.subtitleId,
    )
    if (conv_subtitle.length !== 1) throw new SubtitleNotFound()

    const result = await model.conversationSubtitles.delete(
      req.params.subtitleId,
    )
    if (result.deletedCount !== 1)
      throw new SubtitleError("Error when deleting subtitle")

    res.status(200).send({
      message: "Subtitle has been deleted",
    })
  } catch (err) {
    next(err)
  }
}

async function deleteManySubtitle(req, res, next) {
  try {
    if (!req.query.subtitleId) throw new SubtitleUnsupportedMediaType()

    const idsToRemove = req.query.subtitleId.split(",")
    const result = await model.conversationSubtitles.deleteMany(idsToRemove)

    if (result.deletedCount === 0)
      throw new SubtitleError("No subtitles were deleted.")

    res.status(200).send({
      message: "Subtitles deleted successfully.",
    })
  } catch (err) {
    next(err)
  }
}

async function copySubtitle(req, res, next) {
  try {
    if (!req.params.subtitleId || !req.body.version)
      throw new SubtitleUnsupportedMediaType()

    const subtitle_to_copy = await model.conversationSubtitles.getById(
      req.params.subtitleId,
    )
    if (subtitle_to_copy.length !== 1) throw new SubtitleNotFound()

    const conv_copy = await model.conversationSubtitles.getByConvIdAndVersion(
      req.params.conversationId,
      req.body.version,
    )
    if (conv_copy.length === 1)
      throw new SubtitleError("Version name already exist")

    let subtitle = {
      ...subtitle_to_copy[0],
      version: req.body.version,
    }
    delete subtitle._id
    const result = await model.conversationSubtitles.create(subtitle)

    if (result.insertedId) {
      res.status(201).send({
        _id: result.insertedId.toString(),
        message: "A copy of the subtitle has been created",
      })
    } else res.status(304)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listVersion,
  generateSubtitle,
  getSubtitle,
  updateScreen,
  deleteScreen,
  addScreen,
  updateSubtitle,
  deleteSubtitle,
  deleteManySubtitle,
  copySubtitle,
}
