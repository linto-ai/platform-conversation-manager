const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:format:index`,
)

const cri = require("./cri")
const cra = require("./cra")
const cred = require("./cred")
const resume = require("./resume")
const verbatim = require("./verbatim")

const generators = {
  cri,
  cra,
  cred,
  resume,
  verbatim,
}

module.exports = {
  formatGenerator: (docxContent, document) => {
    const format = docxContent.format || "verbatim" // Default to 'verbatim' if format is not provided
    const generator = generators[format]

    if (generator && typeof generator.generate === "function") {
      return generator.generate(docxContent, document)
    } else {
      return generators.verbatim.generate(docxContent, document) // Fallback to 'verbatim' if format is invalid
    }
  },
  titleGenerator: (docxContent) => {
    const format = docxContent.format || "verbatim" // Default to 'verbatim' if format is not provided
    const generator = generators[format]

    if (generator && typeof generator.title === "function") {
      return generator.title(docxContent.filedata.title)
    } else {
      return generators.verbatim.title(docxContent.filedata.title) // Fallback to 'verbatim' if format is invalid
    }
  },
}
