const debug = require("debug")(
  "linto:conversation-manager:models:mongodb:models:user",
)
const MongoModel = require(`../model`)
const crypto = require("crypto")
const randomstring = require("randomstring")
const moment = require("moment")

const VALIDITY_DATE = require(
  `${process.cwd()}/lib/dao/validityDate/validityDate.js`,
)

const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)

const public_projection = {
  email: 1,
  firstname: 1,
  lastname: 1,
  img: 1,
  private: 1,
}

const personal_projection = {
  salt: 0,
  passwordHash: 0,
  keyToken: 0,
  authLink: 0,
}

const defaultUserPayload = {
  keyToken: null,
  emailIsVerified: false,
  verifiedEmail: [],
  private: false,
  favorites: [],
  emailNotifications: {
    conversations: {
      share: { update: false, delete: false, add: true },
    },
    organizations: { update: false, delete: false, add: true },
  },
}

function generatePasswordHash(password) {
  const salt = randomstring.generate(12)
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, 10000, 512, "sha512")
    .toString("hex")
  return { salt, passwordHash }
}

function generateAuthLink() {
  return {
    magicId: randomstring.generate({
      charset: "alphanumeric",
      length: 20,
    }),
    validityDate: VALIDITY_DATE.generateValidityDate(VALIDITY_DATE.SHORT), // 30 minutes
  }
}

class UsersModel extends MongoModel {
  constructor() {
    super("users") // define name of 'users' collection elsewhere?
  }

  async createSuperAdmin(user) {
    try {
      const { salt, passwordHash } = generatePasswordHash(user.password)
      delete user.password
      const dateTime = moment().format()

      const adminPayload = {
        ...defaultUserPayload,
        ...user,
        email: user.email,
        salt,
        passwordHash,
        authLink: generateAuthLink(),
        emailIsVerified: true,
        verifiedEmail: [user.email],
        created: dateTime,
        last_update: dateTime,
        fromSso: false,
      }

      return await this.mongoInsert(adminPayload)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async create(payload) {
    try {
      const dateTime = moment().format()
      delete payload.password

      if (!payload.fromSso) payload.fromSso = false
      const userPayload = {
        ...payload,
        authLink: generateAuthLink(),
        ...defaultUserPayload,
        role: ROLE.defaultUserRole(),
        created: dateTime,
        last_update: dateTime,
      }

      // If SMTP is disabled, mark the email as verified
      if (process.env.SMTP_HOST === "") {
        userPayload.emailIsVerified = true
        userPayload.verifiedEmail.push(userPayload.email)
      }

      return await this.mongoInsert(userPayload)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async createUser(payload) {
    try {
      const { salt, passwordHash } = generatePasswordHash(payload.password)
      delete payload.password

      const dateTime = moment().format()

      const userPayload = {
        ...payload,
        salt,
        passwordHash,
        accountNotifications: {
          updatePassword: false,
          inviteAccount: false,
        },
        created: dateTime,
        last_update: dateTime,
        fromSso: false,
      }

      return await this.create(userPayload)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async createExternal(payload, fromSso = false) {
    try {
      const dateTime = moment().format()
      delete payload.password

      const externalPayload = {
        lastname: "",
        firstname: "",
        ...payload,
        img: "pictures/default.jpg",
        passwordHash: null,
        accountNotifications: {
          updatePassword: false,
          inviteAccount: true,
        },
        created: dateTime,
        last_update: dateTime,
        fromSso,
      }
      if (fromSso) {
        externalPayload.emailIsVerified = true
        externalPayload.verifiedEmail = [payload.email]
      }

      return await this.create(externalPayload)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async listPublicUsers() {
    try {
      const query = {
        private: false,
        emailIsVerified: true,
      }
      return await this.mongoRequest(query, public_projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async listAllUsers(filter) {
    try {
      let query = {}

      if (filter.name) {
        query.name = {
          $regex: filter.name,
          $options: "i",
        }
      }

      if (filter.lastname) {
        query.lastname = {
          $regex: filter.lastname,
          $options: "i",
        }
      }

      if (filter.email) {
        query.email = {
          $regex: filter.email,
          $options: "i",
        }
      }

      if (!filter) return await this.mongoRequest(query, personal_projection)
      else
        return await this.mongoAggregatePaginate(
          query,
          personal_projection,
          filter,
        )
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getPersonalInfo(id) {
    try {
      const query = {
        _id: this.getObjectId(id),
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
        _id: this.getObjectId(id),
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
        $or: [{ email }, { verifiedEmail: { $in: [email] } }],
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
      _id: this.getObjectId(payload._id),
    }
    delete payload._id
    payload.last_update = moment().format()

    if (payload.password) {
      const salt = randomstring.generate(12)
      const passwordHash = crypto
        .pbkdf2Sync(payload.password, salt, 10000, 512, "sha512")
        .toString("hex")
      delete payload.password
      payload = {
        ...payload,
        salt,
        passwordHash,
        accountNotifications: {
          updatePassword: false,
          inviteAccount: false,
        },
      }
    }
    let mutableElements = payload
    return await this.mongoUpdateOne(query, operator, mutableElements)
  }

  async generateMagicLink(payload) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(payload._id),
      }
      const magicId = randomstring.generate({
        charset: "alphanumeric",
        length: 20,
      })
      const validityDate = VALIDITY_DATE.generateValidityDate(
        VALIDITY_DATE.SHORT,
      )

      let mutableElements = {
        authLink: {
          magicId,
          validityDate,
        },
      }

      if (payload.accountNotifications) {
        // in case accountNotifications is define, but the necessary key are not provided, we set then to false by default
        mutableElements.accountNotifications = {
          inviteAccount: payload.accountNotifications.inviteAccount || false,
          updatePassword: payload.accountNotifications.updatePassword || false,
        }
      }

      const mongo_result = await this.mongoUpdateOne(
        query,
        operator,
        mutableElements,
      )
      return {
        ...mongo_result,
        data: { magicId },
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
        _id: this.getObjectId(id),
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
        _id: this.getObjectId(id),
      }
      return await this.mongoDelete(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async deleteMany(ids) {
    try {
      const objectIdArray = ids.map((id) => {
        if (typeof id === "string") return this.getObjectId(id)
        else if (typeof id === "object") return id
      })

      const query = {
        _id: { $in: objectIdArray },
        role: { $bitsAllClear: ROLE.SUPER_ADMINISTRATOR }, // 4th bit (8 in decimal) must be clear (0)
      }

      return await this.mongoDeleteMany(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }
}

module.exports = new UsersModel()
