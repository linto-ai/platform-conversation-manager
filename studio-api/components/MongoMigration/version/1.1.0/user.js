const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.1:users`,
)

const collections_name = "users"

const migration_update_add = {
  private: false,
  emailIsVerified: true,
  verifiedEmail: [],
}

const migration_update_remove = {
  accountActivated: "",
}

module.exports = {
  up: async (db) => {
    // migration code example
    db.collection(collections_name).updateMany(
      {},
      { $set: migration_update_add },
    )
    db.collection(collections_name).updateMany(
      {},
      { $unset: migration_update_remove },
    )

    // Get user mail to add it in verifiedEmail
    const users = await db.collection(collections_name).find({}).toArray()
    users.forEach(async (user) => {
      if (user.email) {
        await db
          .collection(collections_name)
          .updateOne(
            { _id: user._id },
            { $push: { verifiedEmail: user.email } },
          )
      }
    })
  },
  down: async (db) => {
    // rollback code example
    db.collection(collections_name).updateMany(
      {},
      { $unset: migration_update_add },
    )
    db.collection(collections_name).updateMany(
      {},
      { $set: migration_update_remove },
    )
  },
}
