const debug = require("debug")(
  `linto:components:MongoMigration:controllers:migration:init`,
)

module.exports = async function (db, collectionName) {
  if (!collectionName) return

  const collectionsList = await db.listCollections().toArray()
  const versionCollection = collectionsList.filter(
    (c) => c.name === collectionName,
  )
  if (versionCollection.length === 0) {
    await db.createCollection(collectionName)
  }
}
