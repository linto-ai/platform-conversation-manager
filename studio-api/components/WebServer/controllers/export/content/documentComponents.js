const docx = require("docx")
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Bookmark,
  SectionType,
  Header,
  Footer,
  PageNumber,
  TabStopType,
} = docx

function generateHeader(name) {
  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            text: name,
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
    },
    children: [],
  }
}

function generateFooter() {
  return {
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            thematicBreak: true,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                children: [PageNumber.CURRENT],
              }),
            ],
          }),
        ],
      }),
    },
    children: [],
  }
}

function generateLineBreak() {
  return new Paragraph({
    thematicBreak: true,
  })
}

function generateHeading(
  text,
  headingLevel = HeadingLevel.HEADING_1,
  alignement = AlignmentType.LEFT,
) {
  return new Paragraph({
    heading: headingLevel,
    alignment: alignement,
    children: [
      new Bookmark({
        children: [new TextRun({ text: text, color: "000000" })],
      }),
    ],
  })
}

function generateBulletParagraph(text, level) {
  return new Paragraph({
    text: text,
    bullet: {
      level,
    },
  })
}

function createTextRun(text, bold = false) {
  return new TextRun({
    text,
    bold,
  })
}

function createHighlightedTextRun(text) {
  return new TextRun({
    text,
    highlight: "yellow",
  })
}

function textColumn(nbColumn = 2, space = 500) {
  return {
    properties: {
      type: SectionType.CONTINUOUS,
      column: {
        count: nbColumn,
        space: space,
        separate: false,
        equalWidth: true,
      },
    },
  }
}

module.exports = {
  generateHeader,
  generateFooter,
  generateLineBreak,
  generateHeading,
  generateBulletParagraph,
  createTextRun,
  createHighlightedTextRun,
  textColumn,
}
