const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:docx`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)

const fs = require("fs")

const libre = require("libreoffice-convert")
const docx = require("docx")
const { Packer } = docx
const { Blob } = require("buffer")

const { generate } = require("./generator")

async function generateDocxOnFormat(query, conversationExport) {
  let conversation = await model.conversations.getById(
    conversationExport.convId,
    ["speakers", "name", "description", "owner", "locale", "metadata"],
  )
  data = {
    conversation: conversation[0],
    speakers: conversation[0].speakers.map(
      (speaker) => speaker.speaker_name + " : ",
    ),
    text: conversationExport,
    conversationId: conversationExport.convId,
  }

  let document = await generate(data, query)
  if (document instanceof Buffer)
    return await writeBuffer(document, data.conversation.name)

  return await writeFile(document.doc, data.conversation.name)
}

async function writeFile(doc, name) {
  const buffer = await Packer.toBuffer(doc)
  const outputFilePath = `/tmp/${name.replace(/[^a-zA-Z0-9 ]/g, "")}.docx`
  fs.writeFileSync(outputFilePath, buffer)

  return {
    path: outputFilePath,
    name: name + ".docx",
  }
}

async function writeBuffer(buffer, name) {
  const outputFilePath = `/tmp/${name.replace(/[^a-zA-Z0-9 ]/g, "")}.docx`

  fs.writeFileSync(outputFilePath, buffer)
  return {
    path: outputFilePath,
    name: name + ".docx",
  }
}

async function writeBlobToFile(blob, name) {
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Create output file path and sanitize the file name
  const outputFilePath = `/tmp/${name.replace(/[^a-zA-Z0-9 ]/g, "")}.docx`

  // Write the Buffer to a file
  fs.writeFileSync(outputFilePath, buffer)

  return {
    path: outputFilePath,
    name: name + ".docx",
  }
}
async function convertToPDF(file) {
  const enterData = fs.readFileSync(file.path)

  // Convert it to .pdf format
  const result = await new Promise((resolve, reject) => {
    libre.convert(enterData, ".pdf", undefined, (err, done) => {
      if (err) {
        reject(err)
      } else {
        resolve(done)
      }
    })
  })

  // Write the .pdf file
  const outputFilePath = `/tmp/${file.name.replace(/[^a-zA-Z0-9 ]/g, "")}.pdf`
  fs.writeFileSync(outputFilePath, result)

  // Return the path and name of the .pdf file
  return {
    path: outputFilePath,
    name: `${file.name}.pdf`,
  }
}

module.exports = {
  generateDocxOnFormat,
  convertToPDF,
}
