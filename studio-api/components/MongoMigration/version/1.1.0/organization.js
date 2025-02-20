const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.0:organization`,
)

const collections_name = "organization"

const removed_keys = {
  personal: false,
  type: "public",
}

module.exports = {
  async up(db) {
    db.collection(collections_name).updateMany({}, { $unset: removed_keys })
  },

  async down(db) {
    db.collection(collections_name).updateMany({}, { $set: removed_keys })
  },
}
