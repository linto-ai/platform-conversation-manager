const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:conversation`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

const { CategoryError } = require(
  `${process.cwd()}/components/WebServer/error/exception/category`,
)

async function getOrganizationCategory(req, res, next) {
  try {
    let scopeId = req.params.organizationId || req.params.conversationId
    if (
      req.params.conversationId &&
      TYPE.desiredType(TYPE.LABEL, req.query.type)
    ) {
      const conversation = await model.conversations.getById(scopeId)
      scopeId = conversation[0].organization.organizationId.toString()
    }

    let category = await model.categories.getByScope(scopeId)

    // With the scope id of an organization, we only got a list of categories of label type
    if (category.length === 0) return res.status(204).send()

    // how to do the possess part with only the scopeId ?
    let metadata = []

    if (req.query.expand === "true") {
      let tag_filter
      if (
        category.length > 0 &&
        category[0].type === TYPE.HIGHLIGHT &&
        req.query.possess === "true"
      ) {
        const conversation = await model.conversations.getById(scopeId)
        if (conversation.length === 0)
          throw new CategoryError("Conversation not found")
        tag_filter = conversation[0].tags

        if (req.query.expand === "true")
          metadata = await model.metadata.getMetadata(scopeId)
      }

      // Get all the tags of the list of categories based of their id
      for (let i = 0; i < category.length; i++) {
        const tags = await model.search.tags.getByCategory(
          category[i]._id.toString(),
        )
        if (tags.length > 0 && req.query.possess === "true") {
          let tags_filtered = tags.filter((tag) =>
            tag_filter.includes(tag._id.toString()),
          )
          category[i].tags = tags_filtered
        } else category[i].tags = tags

        if (metadata.length > 0) {
          category[i].tags.map((tag) => {
            const matchingMetadata = metadata
              .filter((meta) => meta.tagId === tag._id.toString())
              .map(({ _id, schema, value }) => ({ _id, schema, value }))
            tag.metadata = matchingMetadata

            return tag
          })
        }
      }
    }
    res.status(200).send(category)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getOrganizationCategory,
}
