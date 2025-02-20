const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:docx:template:eu`,
)

const docx = require("docx")
const { PatchType, patchDocument, TextRun } = docx
const fs = require("fs")
const path = require("path")
const { DateTime } = require("luxon")

const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const DATE_FORMAT = "dd MMMM yyyy HH:mm"

const content = require("../content/document.js")
const { processTurnTable } = require("../content/text.js")
const model = require(`${process.cwd()}/lib/mongodb/models`)

const generate = async (data, query) => {
  let docContent = content.generate(data, query, query.format !== "verbatim")

  if (query.format === "verbatim") {
    //we need to generate a table
    const conversation = await model.conversations.getById(data.conversationId)
    processTurnTable(docContent.transcription, conversation[0], data, query)
  }
  const templatePath = path.join(
    __dirname,
    "eu-template-session-transcription.docx",
  )
  return new Promise((resolve, _) => {
    // we need to use DateTime.now to take into account summer/winter time
    const TZ = query.timezone || systemTimezone
    const offsetMinutes = DateTime.now().setZone(TZ).offset

    let startTime = data.conversation.created
    if (data.conversation?.metadata?.channel?.channel_start_time) {
      startTime = data.conversation.metadata.channel.channel_start_time
    }

    // Parse data.created or create a new date if it's invalid or undefined
    let dateToFormat = DateTime.fromISO(startTime || "", { zone: "local" })
    if (!dateToFormat.isValid) {
      dateToFormat = DateTime.now()
    }
    // Adjust the date by the timezone offset
    const adjustedDate = dateToFormat.plus({ minutes: offsetMinutes })
    const formattedDate = adjustedDate.toFormat(DATE_FORMAT)

    if (Array.isArray(docContent.locale)) {
      docContent.locale = docContent.locale.join()
    }

    patchDocument(fs.readFileSync(templatePath), {
      patches: {
        title: {
          type: PatchType.PARAGRAPH,
          children: [
            new TextRun({
              text: query.title || "Automatic transcription",
              bold: false,
            }),
          ],
        },
        session_name: {
          type: PatchType.PARAGRAPH,
          children: [
            new TextRun(docContent.filedata.title),
            // new TextRun(' - '),
            // new TextRun(channel.name),
          ],
        },
        datetime: {
          type: PatchType.PARAGRAPH,
          children: [
            new TextRun({
              text: formattedDate,
              bold: false,
            }),
          ],
        },
        langue: {
          type: PatchType.PARAGRAPH,
          children: [
            new TextRun({
              text:
                docContent.locale !== "*" ? docContent.locale : "multilingue",
              bold: false,
            }),
          ],
        },
        transcriptions: {
          type: PatchType.DOCUMENT,
          children: docContent.transcription,
        },
      },
    }).then((doc) => {
      resolve(Buffer.from(doc))
      // resolve(new Blob([doc], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }))
    })
  })
}

module.exports = {
  generate,
}
