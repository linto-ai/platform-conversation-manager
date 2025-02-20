const debug = require("debug")(
  "linto:conversation-manager:lib:mongodb:models:organization",
)
const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)
const DEFAULT_PERMISSION = require(
  `${process.cwd()}/lib/dao/organization/permissions`,
).getDefaultPermissions()
const MongoModel = require(`../model`)
const moment = require("moment")

const public_projection = { token: 0 }

class OrganizationModel extends MongoModel {
  constructor() {
    super("organizations")
  }

  async create(payload) {
    try {
      payload.permissions = DEFAULT_PERMISSION // We don't allow user to set permissions orga permissions
      const dateTime = moment().format()
      payload.created = dateTime
      payload.last_update = dateTime
      payload.personal = false

      return await this.mongoInsert(payload)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async createDefault(userId, organizationName, oPayload) {
    try {
      let payload = {
        owner: userId,
        name: organizationName,
        users: [{ userId: userId, role: ROLES.ADMIN }],
        personal: true,
        ...oPayload,
      }
      const dateTime = moment().format()
      payload.created = dateTime
      payload.last_update = dateTime

      payload.permissions = DEFAULT_PERMISSION // We don't allow user to set permissions orga permissions

      const result = await this.mongoInsert(payload)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async createOrgaByAdmin(payload) {
    try {
      const dateTime = moment().format()
      payload.created = dateTime
      payload.last_update = dateTime
      const result = await this.mongoInsert(payload)
      return result
    } catch (error) {
      console.error(error)
      return error
    }
  }

  // update an organization
  async updateOrgaByAdmin(payload) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(payload._id),
      }
      if (payload.organizationId) delete payload.organizationId
      delete payload._id
      payload.last_update = moment().format()

      let mutableElements = payload
      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  // get all organizations
  async getAll(filter) {
    try {
      let query = {}
      if (filter.name) {
        query.name = {
          $regex: filter.name,
          $options: "i",
        }
      }
      if (filter.matchingMail) {
        query.matchingMail = {
          $regex: filter.matchingMail,
          $options: "i",
        }
      }

      if (!filter) return await this.mongoRequest(query)
      else
        return await this.mongoAggregatePaginate(
          query,
          public_projection,
          filter,
        )
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

  async getByIdAndUser(orgaId, userId) {
    try {
      const query = {
        _id: this.getObjectId(orgaId),
        users: {
          $elemMatch: {
            userId: userId.toString(),
          },
        },
      }
      return await this.mongoRequest(query, public_projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getByName(name) {
    try {
      const query = { name }
      return await this.mongoRequest(query, public_projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async listSelf(userId) {
    try {
      const query = {
        users: {
          $elemMatch: {
            userId: userId.toString(),
          },
        },
      }
      return await this.mongoRequest(query, public_projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  // update an organization
  async update(payload) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(payload._id),
      }
      if (payload.organizationId) delete payload.organizationId
      delete payload.permissions
      delete payload._id
      payload.last_update = moment().format()

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
}

module.exports = new OrganizationModel()
