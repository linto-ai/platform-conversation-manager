const debug = require("debug")(
  "linto:conversation-manager:models:mongodb:models:conversationExport",
)
const MongoModel = require(`../model`)

const moment = require("moment")

class SubtitleModel extends MongoModel {
  constructor() {
    super("conversationExport") // define name of 'users' collection elsewhere?
  }

  async create(payload) {
    try {
      const dateTime = moment().format()
      payload.created = dateTime
      payload.last_update = dateTime

      return await this.mongoInsert(payload)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async update(payload) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(payload._id),
      }
      const dateTime = moment().format()
      payload.last_update = dateTime

      let mutableElements = payload
      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async updateStatus(payload) {
    try {
      const operator = "$set"
      const query = {
        convId: payload.convId,
        format: payload.format,
      }
      const dateTime = moment().format()
      payload.last_update = dateTime

      let mutableElements = payload
      return await this.mongoUpdateOne(query, operator, mutableElements)
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

  async deleteAllFromConv(idConv) {
    try {
      if (typeof idConv === "string") idConv = this.getObjectId(idConv)
      const query = { conv_id: idConv }

      return await this.mongoDeleteMany(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getById(id) {
    try {
      const query = {
        _id: this.getObjectId(id),
      }

      return await this.mongoRequest(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getByConvAndFormat(id, format = undefined) {
    try {
      let query = {
        convId: id.toString(),
      }

      if (format) {
        query.format = format
      }

      return await this.mongoRequest(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getByConvId(id, projection) {
    try {
      const query = {
        convId: id.toString(),
      }

      return await this.mongoRequest(query, projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getByJobId(id) {
    try {
      let query = {
        jobId: id.toString(),
      }

      return await this.mongoRequest(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }
}

module.exports = new SubtitleModel()
