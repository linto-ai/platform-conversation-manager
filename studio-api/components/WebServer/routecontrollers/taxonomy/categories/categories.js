const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:conversation`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

const DEFAULT_COLOT = "white"

const {
  CategoryUnsupportedMediaTypepeNotDefined,
  CategoryConflict,
  CategoryError,
} = require(`${process.cwd()}/components/WebServer/error/exception/category`)

async function createCategory(req, res, next) {
  try {
    // Determine the scope id based on the request path req.params.conversationId or req.params.organizationId

    if (!TYPE.checkValue(req.body.type)) {
      throw new CategoryUnsupportedMediaTypepeNotDefined("Type not supported")
    }

    let scopeId = req.params.conversationId || req.params.organizationId

    if (req.params.conversationId) {
      const conversation = await model.conversations.getById(scopeId)
      if (conversation.length === 0)
        throw new CategoryError("Conversation not found")

      if (TYPE.desiredType(TYPE.LABEL, req.body.type)) {
        scopeId = conversation[0].organization.organizationId.toString()
      }
    } else if (req.params.organizationId) {
      const organization = await model.organizations.getById(scopeId)
      if (organization.length === 0)
        throw new CategoryError("Organization not found")
    }

    const category = await model.categories.getByScopeAndName(
      scopeId,
      req.body.name,
      req.body.type,
    )
    if (category.length > 0) {
      throw new CategoryConflict(
        `Conflict with category name ${req.body.name} already exist. Category id ${category[0]._id}`,
      )
    }

    if (!req.body.color) req.body.color = DEFAULT_COLOT
    req.body.scopeId = scopeId
    const result = await model.categories.create(req.body)

    if (result.insertedCount !== 1)
      throw new CategoryError("Error during the creation of the category")

    const category_created = await model.categories.getById(
      result.insertedId.toString(),
    )
    return res.status(201).send(category_created[0])
  } catch (err) {
    next(err)
  }
}

async function getCategory(req, res, next) {
  try {
    let category = await model.categories.getById(req.params.categoryId)
    if (category.length === 0) return res.status(204).send()

    // If category found, we fetch related tags (and metadata if asked)
    const tags = await model.search.tags.getByCategory(req.params.categoryId)
    category[0].tags = tags

    if (
      req.query.metadata === "true" &&
      TYPE.desiredType(TYPE.HIGHLIGHT, category[0].type)
    ) {
      const metadata = await model.metadata.getMetadata(
        req.params.conversationId,
      )

      if (metadata.length > 0) {
        category[0].tags.forEach((tag) => {
          tag.metadata = metadata
            .filter((meta) => meta.tagId === tag._id.toString())
            .map(({ _id, schema, value }) => ({ _id, schema, value }))
        })
      }
    }

    res.status(200).send(category[0])
  } catch (err) {
    next(err)
  }
}

async function updateCategory(req, res, next) {
  try {
    let category = await model.categories.getById(req.params.categoryId)
    if (category.length === 0) throw new CategoryError("Category not found")

    //Check if desired update category name already exist with the body type required
    if (req.body.type && !TYPE.checkValue(req.body.type))
      throw new CategoryUnsupportedMediaTypepeNotDefined("Type not supported")
    else if (req.body.type) category[0].type = req.body.type

    if (req.body.color) category[0].color = req.body.color
    if (req.body.name) category[0].name = req.body.name

    let category_name = await model.categories.getByScopeAndName(
      category[0].scopeId,
      req.body.name,
      req.body.type,
    )
    if (
      category_name.length === 1 &&
      category_name[0]._id.toString() !== req.params.categoryId
    )
      throw new CategoryConflict(
        `Conflict with category name ${req.body.name} already exist. Category id ${category_name[0]._id}`,
      )
    if (category_name.length > 1)
      throw new CategoryConflict(
        `Conflict with category name ${req.body.name} already exist. Category id ${category_name[0]._id}`,
      )

    const result = await model.categories.update(category[0])

    if (result.modifiedCount === 0) res.status(304).send("Nothing to update")
    else res.status(200).send({ message: "Category updated" })
  } catch (err) {
    next(err)
  }
}

async function deleteCategory(req, res, next) {
  try {
    let category = await model.categories.getById(req.params.categoryId)
    if (category.length === 0) throw new CategoryError("Category not found")

    //delete all tag with this categoryId
    let tags = await model.tags.getTagByCategory(req.params.categoryId)

    for (let tag of tags) {
      const result = await model.tags.delete(tag._id)
      if (result.deletedCount !== 1)
        throw new CategoryError("Error during the deletion of the tag")
    }
    // Delete tags from conversations
    const tagsId = tags.map((tag) => tag._id.toString())
    let conv_del_res = await model.conversations.deleteTag(
      req.params.organizationId,
      tagsId,
    )

    await model.tags.deleteAllFromCategory(req.params.categoryId)
    const result = await model.categories.delete(req.params.categoryId)
    if (result.deletedCount !== 1)
      throw new CategoryError("Error during the deletion of the category")

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
}
