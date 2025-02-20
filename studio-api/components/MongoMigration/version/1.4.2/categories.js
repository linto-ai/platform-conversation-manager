const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.4.2:categories`,
)

const collections_name = "categories"
const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

module.exports = {
  async up(db) {
    const categories = await db.collection(collections_name).find({}).toArray()
    categories.map((category) => {
      if (category.type === TYPE.HIGHLIGHT) {
        db.collection("tags").deleteMany({
          categoryId: category._id.toString(),
        })
      }
    })
    db.collection(collections_name).deleteMany({
      organizationId: { $exists: true },
      type: TYPE.HIGHLIGHT,
    })
    db.collection(collections_name).updateMany(
      {},
      { $rename: { organizationId: "scopeId" } },
    )
  },

  async down(db) {
    db.collection(collections_name).updateMany(
      {},
      { $rename: { scopeId: "organizationId" } },
    )
  },
}
