const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.0.0::organization`,
)

const initDb = require(
  `${process.cwd()}/components/MongoMigration/controllers/migration/init`,
)
const collectionName = "organization"

module.exports = {
  async up(db) {
    await initDb(db, collectionName)
  },

  async down(db) {
    // No lower version for this migration
  },
}
