const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:tag:tag",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const { TagError, TagConflict, TagUnsupportedMediaType } = require(
  `${process.cwd()}/components/WebServer/error/exception/tag`,
)

async function createTag(req, res, next) {
  try {
    if (!req.body.name) throw new TagUnsupportedMediaType("name is required")

    const tag = await model.tags.getTagByCategoryAndName(
      req.body.categoryId,
      req.body.name,
    )
    if (tag.length > 0)
      throw new TagConflict(
        `Conflict with tag name ${req.body.name} already exist. Tag id : ${tag[0]._id}`,
      )

    let category = await model.categories.getById(req.body.categoryId)
    if (category.length === 0) throw new TagError("categoryId not found")

    const result = await model.tags.create(req.body)
    if (result.insertedCount !== 1)
      throw new TagError("Error during the creation of the tag")

    const tag_created = await model.tags.getById(result.insertedId.toString())
    return res.status(201).send(tag_created[0])
  } catch (err) {
    next(err)
  }
}

async function updateTag(req, res, next) {
  try {
    const tag = await model.tags.getById(req.params.tagId)
    if (tag.length === 0) throw new TagError("Tag not found")

    const tag_search = await model.tags.getTagByCategoryAndName(
      req.body.categoryId,
      req.body.name,
    )
    if (tag_search.length === 1 && tag[0]._id !== tag_search[0]._id)
      throw new TagConflict()

    if (req.body.name) tag[0].name = req.body.name
    if (req.body.categoryId) {
      const category = await model.categories.getById(req.body.categoryId)
      if (category.length === 0) throw new TagError("categoryId not found")
      tag[0].categoryId = req.body.categoryId
    }

    const result = await model.tags.update(tag[0])
    if (result.modifiedCount === 0) res.status(304).send("Nothing to update")
    else res.status(200).send("Tag updated")
  } catch (err) {
    next(err)
  }
}

async function deleteTag(req, res, next) {
  try {
    let tag = await model.tags.getById(req.params.tagId)
    if (tag.length === 0) throw new TagError("Tag not found")

    const result = await model.tags.delete(req.params.tagId)
    if (result.deletedCount !== 1)
      throw new TagError("Error during the deletion of the tag")

    await model.metadata.deleteMetadataFromTag(req.params.tagId) // delete all related metadata from that tag
    // Delete tag from all the conversations
    let conv_del_res = await model.conversations.deleteTag(
      req.params.organizationId,
      req.params.tagId,
    )

    res.status(200).send("Tag deleted")
  } catch (err) {
    next(err)
  }
}

async function getTag(req, res, next) {
  try {
    let tag = await model.tags.getById(req.params.tagId)
    if (tag.length === 0) return res.status(204).send()
    res.status(200).send(tag[0])
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createTag,
  updateTag,
  deleteTag,
  getTag,
}
