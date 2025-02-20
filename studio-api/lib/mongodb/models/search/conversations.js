const MongoModel = require(`../../model`)
const debug = require("debug")(
  "linto:conversation-manager:models:mongodb:models:conversations",
)

class ConvoModel extends MongoModel {
  constructor() {
    super("conversations")
  }

  async getByTagAndOrga(idOrga, tagList) {
    try {
      const query = {
        "organization.organizationId": idOrga,
        tags: {
          $all: tagList,
        },
      }
      return await this.mongoRequest(query)
    } catch (err) {
      console.error(err)
      return err
    }
  }

  async getByIdsAndTag(idList, tagList) {
    try {
      idList = idList.map((id) => {
        if (typeof id === "string") return this.getObjectId(id)
        else return id
      })

      let query = {
        _id: { $in: idList },
      }

      if (tagList) query.tags = { $all: tagList.split(",") }

      return await this.mongoRequest(query)
    } catch (err) {
      console.error(err)
      return err
    }
  }
}

module.exports = new ConvoModel()
