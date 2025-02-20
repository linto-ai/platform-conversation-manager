const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.0.3:users`,
)

const collections_name = "users"

const migration_update = {
  accountActivated: true,
  authLink: {
    magicId: null,
    validityDate: null,
  },
  accountNotifications: {
    updatePassword: false,
    inviteAccount: false,
  },
  emailNotifications: {
    conversations: {
      sharing: true,
    },
    organizations: {
      invite: false,
    },
  },
}

module.exports = {
  up: async (db) => {
    // migration code example
    db.collection(collections_name).updateMany({}, { $set: migration_update })
  },
  down: async (db) => {
    // rollback code example
    db.collection(collections_name).updateMany({}, { $unset: migration_update })
  },
}
