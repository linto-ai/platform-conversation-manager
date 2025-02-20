const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.1:tags`,
)

const collections_name = "tags"

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
