const debug = require("debug")(
  "linto:conversation-manager:models:mongodb:models:usersFavorite",
)
const MongoModel = require(`../model`)

const favorites_projection = { favorites: 1 }

// Manage user favorites conversations
class UsersModel extends MongoModel {
  constructor() {
    super("users") // define name of 'users' collection elsewhere?
  }

  async add(id, convId) {
    try {
      const query = {
        _id: this.getObjectId(id),
      }
      const operator = "$addToSet"
      const values = {
        favorites: convId,
      }

      return await this.mongoUpdateOne(query, operator, values)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async deleteFav(id, convId) {
    try {
      const query = {
        _id: this.getObjectId(id),
      }
      const operator = "$pull"
      const values = {
        favorites: convId,
      }

      return await this.mongoUpdateOne(query, operator, values)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async listFav(id) {
    try {
      const query = {
        _id: this.getObjectId(id),
      }

      return await this.mongoRequest(query, favorites_projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }
}

module.exports = new UsersModel()
