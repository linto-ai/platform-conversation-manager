const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.2:organization`,
)

const collections_name = "tokens"

const initToken = require(
  `${process.cwd()}/components/MongoMigration/controllers/schema/tokens`,
)

module.exports = {
  async up(db) {
    await initToken(db, collections_name)
  },

  async down(db) {
    // No lower version for this migration
  },
}
