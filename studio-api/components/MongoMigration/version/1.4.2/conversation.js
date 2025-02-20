const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.4.2:conversation`,
)
const moment = require("moment")

const collections_name = "conversations"

module.exports = {
  async up(db) {
    const conversations = await db
      .collection(collections_name)
      .find({})
      .toArray()
    conversations.forEach(async (conv) => {
      let category = await db
        .collection("categories")
        .findOne({
          scopeId: conv._id.toString(),
          type: "highlight",
          name: "keyword",
        })
      if (!category) {
        const dateTime = moment().format()

        await db.collection("categories").insertOne({
          name: "keyword",
          scopeId: conv._id.toString(),
          type: "highlight",
          scope: "nlp-keyword",
          color: "deep-purple",
          createdAt: dateTime,
          updatedAt: dateTime,
        })
      }
    })
  },

  async down(db) {
    // Migration rollback is not necessary, should work with int and string both way
  },
}
