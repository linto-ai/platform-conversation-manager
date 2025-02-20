const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.1:users`,
)

const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)
const collections_name = "users"

const migration_update = {
  role: ROLE.USER,
}

module.exports = {
  up: async (db) => {
    db.collection(collections_name).updateMany(
      { role: { $exists: false } },
      { $set: migration_update },
    )
  },
  down: async (db) => {
    db.collection(collections_name).updateMany(
      { role: { $exists: true } },
      { $unset: migration_update },
    )
  },
}
