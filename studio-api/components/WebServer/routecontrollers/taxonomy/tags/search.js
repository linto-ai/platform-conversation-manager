const { query } = require("express")

const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:taxonomy:taxonomy",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)
const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

const organizationUtility = require(
  `${process.cwd()}/components/WebServer/controllers/organization/utility`,
)

const { OrganizationError } = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)

async function searchTag(req, res, next) {
  try {
    if (req.query.categoryId === undefined || req.query.tags === undefined)
      throw new OrganizationError("categoryId and tags are required")
    const categoryTags = await model.search.tags.getByCategory(
      req.query.categoryId,
    )

    const userConversationsIds = (
      await organizationUtility.getUserConversationFromOrganization(
        req.payload.data.userId,
        req.params.organizationId,
      )
    ).map((conv) => conv._id)

    // Search for conversations based on tags and conversation access
    const conversationsTags = await model.search.conversations.getByIdsAndTag(
      userConversationsIds,
      req.query.tags,
    ) /*.flatMap(conv => conv.tags)*/

    let searchResult = []

    for (let tag of categoryTags) {
      if (searchResult.includes(tag)) continue

      for (let conv of conversationsTags) {
        if (conv.tags.includes(tag._id.toString())) {
          searchResult.push(tag)
          break
        }
      }
    }

    if (searchResult.length === 0) res.status(204).send()
    else res.status(200).send(searchResult)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  searchTag,
}
