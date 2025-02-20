const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.1.2:organization`,
)

const collections_name = "categories"

const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

const category_template = {
  name: "keyword",
  type: TYPE.HIGHLIGHT,
  color: "white",
}

module.exports = {
  async up(db) {
    const orgas = await db.collection("organizations").find({}).toArray()
    orgas.map((orga) => {
      db.collection(collections_name).insertOne({
        ...category_template,
        organizationId: orga._id.toString(),
      })
    })
  },

  async down(db) {
    db.collection(collections_name).deleteMany({ type: TYPE.HIGHLIGHT })
  },
}
