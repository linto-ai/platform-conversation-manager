const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:template:default`,
)

const {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  SectionType,
} = require("docx")
const { generateLineBreak } = require("../content/documentComponents.js")

const { formatGenerator, titleGenerator } = require("../format/index.js")
const content = require("../content/document.js")

function generate(data, query) {
  let docxContent = content.generate(data, query)

  let document = {}
  docxContent.filedata.title = titleGenerator(docxContent)
  document.doc = new Document(docxContent.filedata)

  document.paragraphs = []

  document.paragraphs.push(
    new Paragraph({
      children: [new TextRun(docxContent.filedata.title)],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
  )

  document.paragraphs.push(generateLineBreak())
  document.doc.addSection({
    properties: {
      type: SectionType.CONTINUOUS,
    },
    children: document.paragraphs,
  })
  formatGenerator(docxContent, document)
  return document
}

module.exports = {
  generate,
}
