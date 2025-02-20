const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:generator:verbatim`,
)

const docx = require("docx")
const { SectionType } = docx

const {
  generateHeader,
  textColumn,
} = require("../content/documentComponents.js")

const generate = (docxContent, document) => {
  document.doc.addSection(generateHeader(data.conversation.name))

  const columnProperties = textColumn(2, 500)
  document.doc.addSection({
    ...columnProperties,
    children: docxContent.transcription,
  })

  return document
}

const title = (title) => {
  return title
}

module.exports = {
  generate,
  title,
}
