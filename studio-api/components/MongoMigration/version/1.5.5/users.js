const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.5:users`,
)

const collections_name = "users"

const migration_update = {
  fromSso: false,
}

module.exports = {
  up: async (db) => {
    db.collection(collections_name).updateMany(
      { fromSso: { $exists: false } },
      { $set: migration_update },
    )
  },
  down: async (db) => {
    // No need to revert that migration
  },
}
