const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.6:users`,
)
const moment = require("moment")

const collections_name = "organizations"

module.exports = {
  up: async (db) => {
    await db.collection(collections_name).updateMany(
      { "users.1": { $exists: false } }, // Ensures only one user in the array
      {
        $set: {
          personal: true,
          created: moment().format(),
          last_update: moment().format(),
          matchingMail: "",
        },
      },
    )
  },

  down: async (db) => {
    await db.collection(collections_name).updateMany(
      { personal: true },
      {
        $unset: { personal: "" }, // Removes the `personal` field on rollback
      },
    )
  },
}
