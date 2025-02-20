const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:conversation`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const tagsUtility = require(
  `${process.cwd()}/components/WebServer/controllers/taxonomy/tags`,
)
const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

const { ConversationIdRequire, ConversationNotFound } = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

const { TagError, TagNotFound, TagUnsupportedMediaType } = require(
  `${process.cwd()}/components/WebServer/error/exception/tag`,
)

async function removeTagFromConversation(req, res, next) {
  try {
    if (!req.params.conversationId)
      throw new ConversationIdRequire("Conversation id is required")
    if (!req.params.tagId)
      throw new TagUnsupportedMediaType("Tag id is required")

    const conversationId = req.params.conversationId
    const tagId = req.params.tagId

    const conversation = await model.conversations.getById(conversationId)
    if (conversation.length !== 1) throw new ConversationNotFound()

    if (!conversation[0].tags.includes(tagId)) {
      res.status(304).send("Nothing to update")
    } else {
      let tagsList = conversation[0].tags.filter((tag) => tag !== tagId)

      //add tag to conversation
      await model.conversations.updateTag(conversationId, tagsList)
      res.status(200).json({ message: "Tag deleted from conversation" })
    }
  } catch (err) {
    next(err)
  }
}

async function addTagToConversation(req, res, next) {
  //handle the creation of the tag if he don't exist and add it to the conversation
  try {
    //use the fonction createTag in the file taxonomy/tags/tag.js
    const conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (conversation.length !== 1) throw new ConversationNotFound()

    let tag
    let tagId = req.params.tagId

    if (tagId) {
      tag = await model.tags.getById(req.params.tagId)
      if (tag.length !== 1) throw new TagNotFound()
    } else if (req.body.name && req.body.categoryId) {
      const tag_search = await model.tags.getTagByCategoryAndName(
        req.body.categoryId,
        req.body.name,
      )
      if (tag_search.length > 0) {
        tagId = tag_search[0]._id.toString()
        tag = tag_search
      } else {
        let category = await model.categories.getById(req.body.categoryId)
        if (category.length === 0 || category.length === undefined)
          throw new TagError("categoryId not found")

        const result = await model.tags.create(req.body)
        if (result.insertedCount !== 1)
          throw new TagError("Error during the creation of the tag")
        tagId = result.insertedId.toString()
        tag = await model.tags.getById(tagId)
      }
    } else {
      throw new TagUnsupportedMediaType(
        "Tag id or name and categoryId is required",
      )
    }

    if (conversation[0].tags.includes(tagId)) {
      res.status(304).send("Nothing to update")
    } else {
      let tagsList = [...conversation[0].tags, tagId]
      await model.conversations.updateTag(req.params.conversationId, tagsList)
      return res.status(201).send(tag[0])
    }
  } catch (err) {
    next(err)
  }
}

async function getTagByConv(req, res, next) {
  try {
    let list

    if (
      TYPE.desiredType(TYPE.LABEL, req.query.categoryType) ||
      req.params.organizationId
    ) {
      let category_list
      if (req.params.organizationId) {
        category_list = await model.categories.getByScope(
          req.params.organizationId,
        )
      } else {
        const conversation = await model.conversations.getById(
          req.params.conversationId,
        )
        if (conversation.length !== 1) throw new ConversationNotFound()

        const organizationId =
          conversation[0].organization.organizationId.toString()
        category_list = await model.categories.getByScope(organizationId)
      }
      let categoryId_list = category_list.map((category) =>
        category._id.toString(),
      )

      list = await model.tags.getTagByCategoryList(
        categoryId_list,
        req.query.name,
      )

      if (req.query.expand === "true") {
        list = await tagsUtility.expandTags(list, req.query.categoryType)
      }
    } else if (TYPE.desiredType(TYPE.HIGHLIGHT, req.query.categoryType)) {
      const conversation = await model.conversations.getById(
        req.params.conversationId,
      )
      if (conversation.length !== 1) throw new ConversationNotFound()

      list = await model.tags.getByIdList(conversation[0].tags, req.query.name)
      if (req.query.expand === "true") {
        list = await tagsUtility.expandTags(list, req.query.categoryType)
      }
    }
    if (list.length === 0) {
      res.status(204).send()
    } else {
      res.status(200).send(list)
    }
  } catch (err) {
    next(err)
  }
}

module.exports = {
  addTagToConversation,
  removeTagFromConversation,
  getTagByConv,
}
