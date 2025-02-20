const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:export:generator:index`,
)

const template = require("../template/index")

module.exports = {
  generate: async (data, query) => {
    //if query.template isn't define we use the environement variable EXPORT_TEMPLATE
    if (!query.template) {
      query.template = process.env.EXPORT_TEMPLATE
    }

    if (query.template === "eu") {
      return await template.eu.generate(data, query)
    } else {
      return template.default.generate(data, query)
    }
  },
}
