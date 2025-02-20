const debug = require("debug")(
  `linto:components:MongoMigration:controllers:migration:drop`,
)

module.exports = async function (db, collectionName) {
  if (!collectionName) return

  const collectionList = await db.listCollections().toArray()
  const versionCollection = collectionList.filter(
    (c) => c.name === collectionName,
  )

  if (versionCollection.length !== 0) {
    await db.dropCollection(collectionName)
  }
}
