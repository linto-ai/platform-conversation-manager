const Mail = require("nodemailer/lib/mailer")

const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:users:user",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const orgaUtility = require(
  `${process.cwd()}/components/WebServer/controllers/organization/utility`,
)
const userUtility = require(
  `${process.cwd()}/components/WebServer/controllers/user/utility`,
)

const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)
const Mailing = require(`${process.cwd()}/lib/mailer/mailing`)
const validator = require(`${process.cwd()}/lib/dao/schema/validator`)

const { storeFile, defaultPicture, deleteFile, getStorageFolder } = require(
  `${process.cwd()}/components/WebServer/controllers/files/store`,
)

const { OrganizationConflict } = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)

const {
  UserConflict,
  UserError,
  UserNotFound,
  UserUnsupportedMediaType,
  GenerateMagicLinkError,
} = require(`${process.cwd()}/components/WebServer/error/exception/users`)

const { NodemailerError, NodemailerInvalidEmail } = require(
  `${process.cwd()}/components/WebServer/error/exception/nodemailer`,
)

const { populateUserToOrganization } = require(
  `${process.cwd()}/components/WebServer/controllers/organization/utility`,
)

async function createUser(req, res, next) {
  try {
    if (process.env.DISABLE_USER_CREATION === "true")
      throw new UserError("User creation is disabled")

    const user = req.body
    let organizationName = req.body.organizationName

    if (!user.email || !user.firstname || !user.lastname || !user.password)
      throw new UserUnsupportedMediaType()

    if (req.files && Object.keys(req.files).length !== 0 && req.files.file)
      user.img = await storeFile(req.files.file, "picture")
    else user.img = defaultPicture()

    if (!organizationName) organizationName = user.email + "'s Organization"

    if ((await model.users.getByEmail(user.email)).length !== 0)
      throw new UserConflict()
    if ((await model.organizations.getByName(organizationName)).length !== 0)
      throw new OrganizationConflict()

    const createdUser = await model.users.createUser(user)
    if (createdUser.insertedCount !== 1) throw new UserError()

    if (process.env.DISABLE_DEFAULT_ORGANIZATION_CREATION !== "true") {
      const createdOrganization = await model.organizations.createDefault(
        createdUser.insertedId.toString(),
        organizationName,
      )
      if (createdOrganization.insertedCount !== 1) {
        model.users.delete(createdUser.insertedId.toString())
        throw new UserError()
      }
    }

    let myCreatedUser = await model.users.getById(
      createdUser.insertedId.toString(),
      true,
    )

    const mail_result = await Mailing.accountCreate(
      user.email,
      req,
      myCreatedUser[0].authLink.magicId,
    )
    if (!mail_result) throw new NodemailerError()

    populateUserToOrganization(myCreatedUser[0])

    res.status(201).send({
      message:
        "Account created. An email has been sent to you. Please open it and click on the link to validate your email address.",
    })
  } catch (err) {
    next(err)
  }
}

async function listUser(req, res, next) {
  try {
    const publicUsers = await model.users.listPublicUsers()
    res.status(200).send(publicUsers)
  } catch (err) {
    next(err)
  }
}

async function searchUser(req, res, next) {
  try {
    if (!req.query.search) throw new UserUnsupportedMediaType()

    const userList = (await model.users.listPublicUsers()).filter((user) => {
      const userField = [
        user.firstname,
        user.lastname,
        user.email,
        user.firstname + " " + user.lastname,
        user.lastname + " " + user.firstname,
      ]

      const find = userField
        .map((field) => field?.toLowerCase() ?? "")
        .filter((field) => field.indexOf(req.query.search.toLowerCase()) >= 0)

      return find.length > 0
    })

    if (userList.length === 0) res.status(204).send()
    else res.status(200).send(userList)
  } catch (err) {
    next(err)
  }
}

async function getUserById(req, res, next) {
  try {
    let user
    if (
      ROLE.hasPlatformRoleAccess(
        req.payload.data.role,
        ROLE.SUPER_ADMINISTRATOR,
      )
    ) {
      user = await model.users.getById(req.params.userId, true)
      const { salt, passwordHash, authLink, keyToken, ...cleanedUser } = user[0]
      user = [cleanedUser]
    } else {
      user = await model.users.getById(req.params.userId)
    }

    if (user && user.length !== 1) throw new UserNotFound()
    res.status(200).send({
      ...user[0],
    })
  } catch (err) {
    next(err)
  }
}

async function getPersonalInfo(req, res, next) {
  try {
    const user = await model.users.getPersonalInfo(req.payload.data.userId)
    if (user && user.length !== 1) throw new UserNotFound()

    res.status(200).send({
      ...user[0],
    })
  } catch (err) {
    next(err)
  }
}

async function updateUser(req, res, next) {
  try {
    if (
      !(
        req.body.email ||
        req.body.firstname ||
        req.body.lastname ||
        req.body.accountNotifications ||
        req.body.emailNotifications ||
        req.body.private !== undefined ||
        req.body.password
      )
    )
      throw new UserUnsupportedMediaType()

    const myUser = await model.users.getById(req.payload.data.userId, true)
    if (myUser.length !== 1) throw new UserNotFound()
    let user = myUser[0]

    if (req.body.email) {
      if (myUser[0].fromSso)
        throw new UserError("Cannot update email for an SSO user")

      const userMail = await model.users.getByEmail(req.body.email)

      if (
        userMail.length !== 0 &&
        userMail[0]._id.toString() !== user._id.toString()
      )
        throw new UserConflict("Email already used")

      if (user.email !== req.body.email) {
        if (!user.verifiedEmail.includes(user.email) && user.emailIsVerified) {
          user.verifiedEmail.push(user.email)
        }
        user.email = req.body.email
        user.emailIsVerified = false
      }
    }
    if (req.body.firstname) user.firstname = req.body.firstname
    if (req.body.lastname) user.lastname = req.body.lastname
    if (req.body.private !== undefined) user.private = req.body.private
    if (req.body.password) user.password = req.body.password

    if (req.body.accountNotifications) {
      for (let key of Object.keys(req.body.accountNotifications)) {
        user.accountNotifications[key] = req.body.accountNotifications[key]
      }
    }
    if (req.body.emailNotifications) {
      let emailNotifications = req.body.emailNotifications
      if (typeof emailNotifications !== "object")
        emailNotifications = JSON.parse(emailNotifications)
      if (validator(req.body.emailNotifications, "emailNotification")) {
        user.emailNotifications = emailNotifications
      }
    }

    const result = await model.users.update(user)
    if (result.matchedCount === 0) throw new UserError()
    else if (result.modifiedCount === 1)
      res.status(200).send({ message: "User updated" })
    else res.status(202).send()
  } catch (err) {
    next(err)
  }
}

async function updateUserPicture(req, res, next) {
  try {
    if (!req.files && Object.keys(req.files).length === 0 && !req.files.file)
      throw new UserUnsupportedMediaType()
    const payload = {
      _id: req.payload.data.userId,
      img: await storeFile(req.files.file, "picture"),
    }

    const user = await model.users.getById(req.payload.data.userId)
    if (user.length !== 1) throw new UserNotFound()

    const result = await model.users.update(payload)
    if (result.matchedCount === 0) throw new UserError()

    if (user[0].img !== defaultPicture())
      await deleteFile(`${getStorageFolder()}/${user[0].img}`)

    res.status(200).send({
      message: "User picture updated",
    })
  } catch (err) {
    next(err)
  }
}

async function logout(req, res, next) {
  try {
    if (!req.payload.data && !req.payload.data.tokenId)
      throw new UserUnsupportedMediaType()
    const result = await model.tokens.delete(req.payload.data.tokenId)
    if (result.matchedCount === 0) throw new UserError()

    res.status(200).send({ message: "User has been disconnected" })
  } catch (err) {
    next(err)
  }
}

async function recoveryAuth(req, res, next) {
  try {
    if (!req.body.email) throw new UserUnsupportedMediaType()
    const user = await model.users.getByEmail(req.body.email, true)
    if (user.length !== 1) {
      debug(
        `Forgotten password request for an unknown or invalid email address: ${req.body.email}`,
      )
      res.status(200).send({
        message: "An email with an authentication link has been sent to you.",
      })
    } else {
      user[0].accountNotifications.updatePassword = true
      const updatedUser = await model.users.generateMagicLink(user[0])
      if (updatedUser.modifiedCount === 0) throw new GenerateMagicLinkError()

      const mail_result = await Mailing.resetPassword(
        req.body.email,
        req,
        updatedUser.data.magicId,
      )
      if (!mail_result)
        res.status(400).send({ message: "Error while sending email" })
      else
        res.status(200).send({
          message: "An email with an authentication link has been sent to you.",
        })
    }
  } catch (error) {
    next(error)
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = req.payload.data.userId
    let removeMedia = await userUtility.removeUserFromPlatform(userId)

    if (removeMedia) {
      const result = await model.users.delete(userId)
      if (result.deletedCount !== 1) throw new UserError()

      res.status(200).send({ message: "User deleted" })
    } else {
      throw new UserError(
        "Unable to delete the user, please contact an administrator",
      )
    }
  } catch (err) {
    next(err)
  }
}
async function sendVerificationEmail(req, res, next) {
  try {
    const userId = req.payload.data.userId
    const user = await model.users.getById(userId)
    if (user.length !== 1) throw new UserNotFound()

    await model.users.generateMagicLink({ _id: userId })

    const userUpdated = await model.users.getById(userId, true)
    const email = userUpdated[0].email
    const magicId = userUpdated[0].authLink.magicId
    const mail_result = await Mailing.verifyEmailAddress(email, req, magicId)
    if (!mail_result) throw "Error when sending mail"

    res.status(200).send({
      status: "success",
      message: "An email has been sent to you.",
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listUser,
  searchUser,
  getUserById,
  getPersonalInfo,
  deleteUser,
  createUser,
  logout,
  updateUser,
  updateUserPicture,
  recoveryAuth,
  sendVerificationEmail,
}
