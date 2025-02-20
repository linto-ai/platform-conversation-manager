const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:content:transcription`,
)

const docx = require("docx")
const { SectionType } = docx

const { processTurn } = require("./text.js")

const generate = (data, query, enableProcess = true) => {
  // const templateDoc = template.generate(data, query)

  if (!query.template) {
    query.template = "default"
  }
  if (!query.format) {
    query.template = "verbatim"
  }
  const document = {
    filedata: {
      creator: data.conversation.owner,
      title: data.documentTitle || data.conversation.name,
      description: data.conversation.description,
      sections: [],
    },
    locale: data.conversation.locale,
    format: query.format,
    template: query.template,
    transcription: [],
  }

  if (enableProcess) processTurn(document.transcription, data)
  return document
}

module.exports = {
  generate,
}
