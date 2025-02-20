const { DocumentAttributes } = require("docx")
const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:conversation:share`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const tagsUtility = require(
  `${process.cwd()}/components/WebServer/controllers/taxonomy/tags`,
)

async function listShareTags(req, res, next) {
  try {
    const userId = req.payload.data.userId

    const sharedConversation = await model.conversations.getByShare(
      userId,
      req.query,
    )
    let tags = []

    sharedConversation.list.map((conv) =>
      conv.tags.map((tag) =>
        tags.indexOf(tag) === -1 ? tags.push(tag) : undefined,
      ),
    )
    let tags_list = await model.tags.getByIdList(tags)

    let categoryList = await tagsUtility.expandTags(tags_list)

    if (categoryList.length === 0) res.status(204).send()
    else res.status(200).send(categoryList)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listShareTags,
}
