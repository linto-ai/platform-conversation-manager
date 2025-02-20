const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.1:users`,
)

const collections_name = "users"

const migration_update_add = {
  favorites: [],
}

module.exports = {
  async up(db) {
    db.collection(collections_name).updateMany(
      {},
      { $set: migration_update_add },
    )
  },

  async down(db) {
    db.collection(collections_name).updateMany(
      {},
      { $unset: migration_update_add },
    )
  },
}
