const debug = require("debug")(
  "linto:conversation-manager:models:mongodb:models:token",
)
const MongoModel = require(`../model`)

class TokenModel extends MongoModel {
  constructor() {
    super("tokens") // define name of 'users' collection elsewhere?
  }

  async insert(user_id, salt) {
    try {
      let payload = {
        userId: user_id.toString(),
        salt: salt,
        createdAt: new Date(Date.now()),
      }

      return await this.mongoInsert(payload)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async delete(id) {
    try {
      const query = {
        _id: this.getObjectId(id),
      }
      return await this.mongoDelete(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getTokenById(id, userId) {
    try {
      const query = {
        _id: this.getObjectId(id),
        userId: userId,
      }
      return await this.mongoRequest(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }
}

module.exports = new TokenModel()
