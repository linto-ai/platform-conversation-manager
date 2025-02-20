const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.3:version`,
)

const previous_version = "1.5.2"
const version = "1.5.3"

module.exports = {
  async up(db) {
    return db
      .collection("version")
      .updateMany({}, { $set: { version: version } })
  },

  async down(db) {
    return db
      .collection("version")
      .updateMany({}, { $set: { version: previous_version } })
  },
}
