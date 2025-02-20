const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.2:users`,
)

const collections_name = "users"

const migration_update = {
  emailNotifications: {
    conversations: {
      share: {
        update: false,
        delete: false,
        add: true,
      },
    },
    organizations: {
      update: false,
      delete: false,
      add: true,
    },
  },
}

const migration_to_remove = {
  "emailNotifications.conversations.sharing": true,
}

module.exports = {
  up: async (db) => {
    db.collection(collections_name).updateMany({}, { $set: migration_update })
    db.collection(collections_name).updateMany(
      {},
      { $unset: migration_to_remove },
    )
  },
  down: async (db) => {
    db.collection(collections_name).updateMany({}, { $unset: migration_update })
    db.collection(collections_name).updateMany(
      {},
      { $set: migration_to_remove },
    )
  },
}
