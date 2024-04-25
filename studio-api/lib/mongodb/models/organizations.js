const debug = require('debug')('linto:conversation-manager:lib:mongodb:models:organization')
const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)

const MongoModel = require(`../model`)

const PostgreModel = require(`${process.cwd()}/lib/mongodb/models/postgreSQL/index`)

const public_projection = { token: 0 }

class OrganizationModel extends MongoModel {

    constructor() {
        super('organizations')
    }

    async create(payload) {
        try {
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
                ...oPayload
            }

            const result = await this.mongoInsert(payload)
            return result
        } catch (error) {
            console.error(error)
            return error
        }
    }

    // get all organizations
    async getAll() {
        try {
            const query = {}
            const projetion = { token: 0, users: 0 }
            return await this.mongoRequest(query, projetion)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    // get a user by id
    async getById(id) {
        try {
            const query = {
                _id: this.getObjectId(id)
            }
            return await this.mongoRequest(query)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async getByIdAndUser(orgaId, userId) {
        try {
            if (process.env.DB_MODE === 'postgreSQL') {
                return await PostgreModel.organizations.getByIdAndUser(orgaId, userId)
            } else {
                const query = {
                    _id: this.getObjectId(orgaId),
                    "users": {
                        $elemMatch: {
                            userId: this.getObjectId(userId),
                        }
                    }
                }
                return await this.mongoRequest(query, public_projection)
            }
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
            if (process.env.DB_MODE === 'postgreSQL') {
                return await PostgreModel.organizations.listSelf(userId)
            } else {
                const query = {
                    "users": {
                        $elemMatch: {
                            userId: this.getObjectId(userId),
                        }
                    }
                }

                return await this.mongoRequest(query, public_projection)
            }
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
                _id: this.getObjectId(payload._id)
            }

            if (payload.organizationId)
                delete payload.organizationId

            delete payload._id
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
                _id: this.getObjectId(id)
            }
            return await this.mongoDelete(query)
        } catch (error) {
            console.error(error)
            return error
        }
    }
}

module.exports = new OrganizationModel()