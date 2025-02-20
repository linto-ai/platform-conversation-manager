const Mail = require("nodemailer/lib/mailer")

const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:administration:user",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)
const Mailing = require(`${process.cwd()}/lib/mailer/mailing`)

const userUtility = require(
  `${process.cwd()}/components/WebServer/controllers/user/utility`,
)

const { defaultPicture } = require(
  `${process.cwd()}/components/WebServer/controllers/files/store`,
)

const { UserConflict, UserError, UserUnsupportedMediaType } = require(
  `${process.cwd()}/components/WebServer/error/exception/users`,
)

const { NodemailerError } = require(
  `${process.cwd()}/components/WebServer/error/exception/nodemailer`,
)

const admin_projection = {
  email: 1,
  firstname: 1,
  lastname: 1,
  img: 1,
  private: 1,
  role: 1,
}

async function createSuperUser(req, res, next) {
  try {
    if (process.env.DISABLE_USER_CREATION === "true")
      throw new UserError("User creation is disabled")

    let user = req.body
    if (!user.email || !user.password || !user.role)
      throw new UserUnsupportedMediaType()
    user.img = defaultPicture()

    //convert user.role to a number
    user.role = parseInt(user.role)

    if (!ROLE.isValid(user.role))
      throw new UserUnsupportedMediaType("Role invalid")

    if ((await model.users.getByEmail(user.email)).length !== 0)
      throw new UserConflict()

    const createdUser = await model.users.createSuperAdmin(user)
    if (createdUser.insertedCount !== 1) throw new UserError()

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

    res.status(201).send({
      message:
        "Account created. An email has been sent to the created account.",
    })
  } catch (err) {
    next(err)
  }
}

async function listAllUser(req, res, next) {
  try {
    const users = await model.users.listAllUsers(req.query)
    return res.status(200).send(users)
  } catch (err) {
    next(err)
  }
}

async function deleteUser(req, res, next) {
  try {
    if (!req.body.userIds) throw new UserUnsupportedMediaType()

    if (!Array.isArray(req.body.userIds))
      throw new UserUnsupportedMediaType("userIds must be an array")

    for (const userId of req.body.userIds) {
      await userUtility.removeUserFromPlatform(userId)
    }
    const result = await model.users.deleteMany(req.body.userIds)
    if (result.deletedCount !== req.body.userIds.length)
      throw new UserError("User not deleted")

    return res.status(200).send({ message: "User deleted" })
  } catch (err) {
    next(err)
  }
}

async function updateUser(req, res, next) {
  try {
    if (!req.params.userId) throw new UserUnsupportedMediaType()

    let user = await model.users.getByIdFilter(
      req.params.userId,
      admin_projection,
    )
    if (user.length === 0) throw new UserError("User not found")
    if (ROLE.hasPlatformRoleAccess(user[0].role, ROLE.SUPER_ADMINISTRATOR))
      throw new UserError("Cannot update that user")

    user[0]._id = req.params.userId
    const userUpdate = {
      ...user[0],
      ...req.body,
      _id: req.params.userId,
    }

    await model.users.update(userUpdate)
    return res.status(200).send({ message: "User updated" })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createSuperUser,
  listAllUser,
  deleteUser,
  updateUser,
}
