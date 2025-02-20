const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.0:organizations`,
)

const collections_name = "organizations"
const previous_collections_name = "organization"

module.exports = {
  async up(db) {
    db.collection(previous_collections_name).rename(collections_name)
  },

  async down(db) {
    db.collection(collections_name).rename(previous_collections_name)
  },
}
