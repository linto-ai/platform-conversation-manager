const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:conversation`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const validator = require(`${process.cwd()}/lib/dao/schema/validator`)

const {
  MetadataNotFound,
  MetadataError,
  MetadataUnsupportedMediaType,
} = require(`${process.cwd()}/components/WebServer/error/exception/metadata`)

async function getConvMetadata(req, res, next) {
  try {
    const metadata = await model.metadata.getMetadata(req.params.conversationId)

    res.status(200).send(metadata)
  } catch (err) {
    next(err)
  }
}

async function getTagMetadata(req, res, next) {
  try {
    const metadata = await model.metadata.getMetadata(
      req.params.conversationId,
      req.params.tagId,
    )

    res.status(200).send(metadata)
  } catch (err) {
    next(err)
  }
}

async function createMetadata(req, res, next) {
  try {
    req.body.conversationId = req.params.conversationId
    req.body.tagId = req.params.tagId
    req.body.createdBy = req.payload.data.userId

    if (typeof req.body.value === "string") {
      try {
        req.body.value = JSON.parse(req.body.value)
      } catch (error) {
        throw new MetadataError("Value format require to be an object")
      }
    }

    if (!validator(req.body, "metadata"))
      throw new MetadataUnsupportedMediaType("metadata format is not valid")

    const result = await model.metadata.create(req.body)
    if (result.insertedCount !== 1)
      throw new MetadataError("Error during the creation of the metadata")

    const conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (!conversation[0].tags.includes(req.params.tagId)) {
      let tagsList = [...conversation[0].tags, req.params.tagId]
      await model.conversations.updateTag(req.params.conversationId, tagsList)
    }

    const metadata_created = await model.tags.getById(
      result.insertedId.toString(),
    )
    req.body._id = result.insertedId.toString()

    return res.status(201).send(req.body)
  } catch (err) {
    next(err)
  }
}

async function updateMetadata(req, res, next) {
  try {
    const metadata = await model.metadata.getById(req.params.metadataId)
    if (metadata.length === 0) throw new MetadataNotFound("Metadata not found")

    let update_metadata = {
      ...metadata[0],
      ...req.body,
    }

    if (typeof update_metadata.value === "string") {
      try {
        update_metadata.value = JSON.parse(update_metadata.value)
      } catch (error) {
        throw new MetadataError("Value format require to be an object")
      }
    }

    if (!validator(update_metadata, "metadata"))
      throw new MetadataUnsupportedMediaType("metadata format is not valid")

    let result = await model.metadata.update(update_metadata)
    if (result.result.nModified === 1)
      res.status(200).send({ message: "Metadata updated" })
    else res.status(304).send()
  } catch (err) {
    next(err)
  }
}

async function deleteMetadata(req, res, next) {
  try {
    let metadata = await model.metadata.getById(req.params.metadataId)
    if (metadata.length === 0) throw new MetadataNotFound("Metadata not found")

    const result = await model.metadata.delete(req.params.metadataId)
    if (result.deletedCount !== 1)
      throw new MetadataError("Error during the deletion of the metadata")

    res.status(200).send("Metadata deleted")
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getConvMetadata,
  getTagMetadata,
  createMetadata,
  updateMetadata,
  deleteMetadata,
}
