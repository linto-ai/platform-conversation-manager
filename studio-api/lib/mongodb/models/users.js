const debug = require('debug')('linto:conversation-manager:models:mongodb:models:user')
const MongoModel = require(`../model`)
const crypto = require('crypto')
const randomstring = require('randomstring')

const VALIDITY_DATE = require(`${process.cwd()}/lib/dao/validityDate/validityDate.js`)
const public_projection = { email: 1, firstname: 1, lastname: 1, img: 1, private: 1 }

const personal_projection = { salt: 0, passwordHash: 0, keyToken: 0, authLink: 0 }

class UsersModel extends MongoModel {

    constructor() {
        super('users') // define name of 'users' collection elsewhere?
    }

    async create(payload) {
        try {
            payload = {
                ...payload,
                authLink: {
                    magicId: randomstring.generate({ charset: 'alphanumeric', length: 20 }),
                    validityDate: VALIDITY_DATE.generateValidityDate(VALIDITY_DATE.SHORT), // 30 minutes
                },
                keyToken: null,
                emailIsVerified: false,
                verifiedEmail: [],
                private: false,
                favorites: [],
                emailNotifications: {
                    conversations: {
                        share: {
                            update: false,
                            delete: false,
                            add: true
                        }
                    },
                    organizations: {
                        update: false,
                        delete: false,
                        add: true
                    }
                }
            }

            if (process.env.SMTP_HOST === '') {
                payload.emailIsVerified = true
                payload.verifiedEmail.push(payload.email)
            }
            
            return await this.mongoInsert(payload)
        } catch (error) {
            console.error(error)
            return error
        }
    }


    // create a user
    async createUser(payload) {
        try {
            payload.salt = randomstring.generate(12)
            payload.passwordHash = crypto.pbkdf2Sync(payload.password, payload.salt, 10000, 512, 'sha512').toString('hex')
            delete payload.password

            payload.accountNotifications = {
                updatePassword: false,
                inviteAccount: false
            }
            return await this.create(payload)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    // create a user
    async createExternal(payload) {
        try {
            payload.lastname = ''
            payload.firstname = ''
            payload.img = 'pictures/default.jpg'
            payload.passwordHash = null
            payload.accountNotifications = {
                updatePassword: false,
                inviteAccount: true
            }

            return await this.create(payload)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async listPublicUsers() {
        try {
            const query = {
                private: false,
                emailIsVerified: true
            }
            return await this.mongoRequest(query, public_projection)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async getPersonalInfo(id) {
        try {
            const query = {
                _id: this.getObjectId(id)
            }
            return await this.mongoRequest(query, personal_projection)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async getById(id, serverAccess = false) {
        try {
            const query = {
                _id: this.getObjectId(id)
            }

            if (serverAccess) return await this.mongoRequest(query)
            else return await this.mongoRequest(query, public_projection)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async getByIdFilter(id, filter = undefined) {
        try {
            const query = {
                _id: this.getObjectId(id),
            }
            return await this.mongoRequest(query, { ...filter })
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async getByEmail(email, serverAccess = false) {
        try {
            const query = {
                '$or': [
                    { email },
                    { verifiedEmail: { '$in': [email] } }
                ]
            }
            if (serverAccess) return await this.mongoRequest(query)
            else return await this.mongoRequest(query, public_projection)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    async update(payload) {
        const operator = "$set"
        const query = {
            _id: this.getObjectId(payload._id)
        }
        delete payload._id

        if (payload.password) {
            const salt = randomstring.generate(12)
            const passwordHash = crypto.pbkdf2Sync(payload.password, salt, 10000, 512, 'sha512').toString('hex')
            delete payload.password
            payload = {
                ...payload,
                salt,
                passwordHash,
                accountNotifications: {
                    updatePassword: false,
                    inviteAccount: false
                }
            }
        }
        let mutableElements = payload

        return await this.mongoUpdateOne(query, operator, mutableElements)
    }

    async generateMagicLink(payload) {
        try {
            const operator = "$set"
            const query = {
                _id: this.getObjectId(payload._id)
            }
            const magicId = randomstring.generate({ charset: 'alphanumeric', length: 20 })
            const validityDate = VALIDITY_DATE.generateValidityDate(VALIDITY_DATE.SHORT)

            let mutableElements = {
                authLink: {
                    magicId,
                    validityDate
                }
            }

            if (payload.accountNotifications) {
                // in case accountNotifications is define, but the necessary key are not provided, we set then to false by default
                mutableElements.accountNotifications = {
                    inviteAccount: payload.accountNotifications.inviteAccount || false,
                    updatePassword: payload.accountNotifications.updatePassword || false
                }
            }

            const mongo_result = await this.mongoUpdateOne(query, operator, mutableElements)
            return {
                ...mongo_result,
                data: { magicId }
            }
        } catch (error) {
            return error
        }
    }

    async getByMagicId(magicId, serverAccess = false) {
        try {
            const query = { "authLink.magicId": magicId }
            if (serverAccess) return await this.mongoRequest(query)
            else return await this.mongoRequest(query, public_projection)
        } catch (error) {
            return error
        }
    }

    // Should not be open to the REST API
    async getTokenById(id) {
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
    async getTokenByEmail(email) {
        try {
            const query = { email }
            return await this.mongoRequest(query)
        } catch (error) {
            console.error(error)
            return error
        }
    }

    // delete a user
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

module.exports = new UsersModel()
