const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.1:organization`,
)

const collections_name = "organizations"

module.exports = {
  async up(db) {
    const orgas = await db.collection(collections_name).find({}).toArray()
    orgas.map((orga) => {
      orga.users.forEach((user) => {
        if (user.role >= 3) user.role = user.role + 1
      })
      db.collection(collections_name).updateOne(
        { _id: orga._id },
        { $set: { users: orga.users } },
      )
    })
  },

  async down(db) {
    const orgas = await db.collection(collections_name).find({}).toArray()
    orgas.map((orga) => {
      orga.users.forEach((user) => {
        if (user.role >= 2) user.role = user.role - 1
      })
      db.collection(collections_name).updateOne(
        { _id: orga._id },
        { $set: { users: orga.users } },
      )
    })
  },
}
