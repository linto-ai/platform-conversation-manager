const debug = require('debug')('linto:conversation-manager:lib:mongodb:models:postgreSQL:organizations')

const MongoModel = require(`../../model`)
const public_projection = { token: 0 }

class OrganizationPostgreHandler extends MongoModel {

    constructor() {
        super('organizations')
    }

    async getByIdAndUser(orgaId, userId) {
        try {
            const lorganization = await this.mongoRequest({
                _id: this.getObjectId(orgaId)
            }, public_projection)
            const userOrga = lorganization.filter(orga => orga.users.some(user => user.userId === userId))
            
            return userOrga
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async listSelf(userId) {
        try {
            const lorganization = await this.mongoRequest({}, public_projection)
            const userOrga = lorganization.filter(orga => orga.users.some(user => user.userId === userId))
            
            return userOrga
        } catch (error) {
            console.error(error)
            return error
        }
    }
}

module.exports = new OrganizationPostgreHandler()