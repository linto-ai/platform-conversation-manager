const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.4:users`,
)
const moment = require("moment")

const collections_name = "organizations"

module.exports = {
  up: async (db) => {
    await db.collection(collections_name).updateMany(
      {}, // Apply to all documents
      {
        $set: {
          created: moment().format(),
          last_update: moment().format(),
          matchingMail: "",
        },
      },
    )
  },

  down: async (db) => {
    await db.collection(collections_name).updateMany(
      {}, // Apply to all documents
      { $unset: { created: "", last_update: "", matchingMail: "" } }, // Explicitly unset fields
    )
  },
}
