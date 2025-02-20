const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:generator:cri`,
)

const docx = require("docx")
const { SectionType } = docx

const {
  generateHeader,
  textColumn,
} = require("../content/documentComponents.js")

const generate = (docxContent, document) => {
  document.doc.addSection(generateHeader(data.conversation.name))

  const columnProperties = textColumn(2, 720)
  document.doc.addSection({
    ...columnProperties,
    children: docxContent.transcription,
  })

  return document
}

const title = () => {
  return "texte pour le Compte Rendu Analytique"
}

module.exports = {
  generate,
  title,
}
