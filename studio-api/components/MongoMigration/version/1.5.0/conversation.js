const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.0:conversation`,
)
const collections_name = "conversations"

module.exports = {
  async up(db) {
    const conversations = await db
      .collection(collections_name)
      .find({})
      .toArray()
    conversations.forEach(async (conv) => {
      //we want to add conversation type to every conversation that doesn't have it
      if (!conv.type) {
        await db
          .collection(collections_name)
          .updateOne(
            { _id: conv._id },
            { $set: { type: { mode: "canonical", child_conversations: [] } } },
          )
      }
    })
  },

  async down(db) {
    // Migration rollback is not necessary, should work with in and string both way
    const conversations = await db
      .collection(collections_name)
      .find({})
      .toArray()
    conversations.forEach(async (conv) => {
      //we want to remove the type field from every conversation
      if (conv.type) {
        await db
          .collection(collections_name)
          .updateOne({ _id: conv._id }, { $unset: { type: 1 } })
      }
    })
  },
}
