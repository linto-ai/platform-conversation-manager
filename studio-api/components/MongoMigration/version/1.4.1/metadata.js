const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.4.1:metadata`,
)

const collections_name = "metadata"

const initDb = require(
  `${process.cwd()}/components/MongoMigration/controllers/migration/init`,
)
const dropDb = require(
  `${process.cwd()}/components/MongoMigration/controllers/migration/drop`,
)

module.exports = {
  async up(db) {
    await initDb(db, collections_name)
  },

  async down(db) {
    await dropDb(db, collections_name)
  },
}
