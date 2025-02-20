const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.4.3:conversation_export`,
)

const initDb = require(
  `${process.cwd()}/components/MongoMigration/controllers/migration/init`,
)

const collectionName = "conversationExport"

module.exports = {
  async up(db) {
    await initDb(db, collectionName)
  },

  async down(db) {
    // No lower version for this migration
  },
}
