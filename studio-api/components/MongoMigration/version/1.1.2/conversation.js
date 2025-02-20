const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.2:categories`,
)

const collections_name = "conversations"

module.exports = {
  async up(db) {
    const conversations = await db
      .collection(collections_name)
      .find({})
      .toArray()
    conversations.forEach(async (conv) => {
      if (!isNaN(conv.organization.membersRight)) {
        let membersRight = parseInt(conv.organization.membersRight)
        await db
          .collection(collections_name)
          .updateOne(
            { _id: conv._id },
            { $set: { "organization.membersRight": membersRight } },
          )
      }
    })
  },

  async down(db) {
    // Migration rollback is not necessary, should work with int and string both way
  },
}
