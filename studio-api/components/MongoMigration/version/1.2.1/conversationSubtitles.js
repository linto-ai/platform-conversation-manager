const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.2.1:conversation_subtitles`,
)

const initDb = require(
  `${process.cwd()}/components/MongoMigration/controllers/migration/init`,
)
const collectionName = "conversation_subtitles"

module.exports = {
  async up(db) {
    await initDb(db, collectionName)
  },

  async down(db) {
    // No lower version for this migration
  },
}
