const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:organizations:maitainer",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const Mailing = require(`${process.cwd()}/lib/mailer/mailing`)

const orgaUtility = require(
  `${process.cwd()}/components/WebServer/controllers/organization/utility`,
)

const { deleteFile, getStorageFolder } = require(
  `${process.cwd()}/components/WebServer/controllers/files/store`,
)
const { updateChildConversation } = require(
  `${process.cwd()}/components/WebServer/controllers/conversation/child`,
)

const {
  OrganizationError,
  OrganizationUnsupportedMediaType,
  OrganizationForbidden,
  OrganizationNotFound,
  OrganizationConflict,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)

const { ConversationError } = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

const { UserError } = require(
  `${process.cwd()}/components/WebServer/error/exception/users`,
)

const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)
const RIGHTS = require(`${process.cwd()}/lib/dao/conversation/rights`)

async function addUserInOrganization(req, res, next) {
  try {
    if (!req.params.organizationId || !req.body.email || !req.body.role)
      throw new OrganizationUnsupportedMediaType()

    if (isNaN(req.body.role) && TYPES.checkValue(req.body.role))
      throw new OrganizationUnsupportedMediaType("Role value is not valid")
    if (ROLES.canGiveAccess(req.body.role, req.userRole))
      throw new OrganizationForbidden()

    let organization = await model.organizations.getById(
      req.params.organizationId,
    )
    let user = await model.users.getByEmail(req.body.email)

    if (organization.length === 0) throw new OrganizationNotFound()
    else organization = organization[0]

    let userId = null
    let magicId = null
    if (user.length === 0) {
      if (process.env.DISABLE_USER_CREATION === "true")
        throw new UserError("User creation is disabled")

      const createdUser = await model.users.createExternal({
        email: req.body.email,
      })

      // Create new user personal organization
      if (createdUser.insertedCount !== 1) throw new UserError()
      userId = createdUser.insertedId.toString()
      magicId = createdUser.ops[0].authLink.magicId
      if (magicId) {
        const createOrganization = await model.organizations.createDefault(
          userId,
          req.body.email + "'s Organization",
          {},
        )
        if (createOrganization.insertedCount !== 1) {
          await model.users.delete(userId)
          throw new UserError()
        }
      }
    } else {
      userId = user[0]._id.toString()
      if (
        organization.users.filter((oUser) => oUser.userId === userId).length !==
        0
      )
        throw new OrganizationConflict(
          req.body.email + " is already in " + organization.name,
        )
    }

    organization.users.push({
      userId: userId,
      role: parseInt(req.body.role),
    })

    const result = await model.organizations.update(organization)
    if (result.matchedCount === 0) throw new OrganizationError()

    const sharedUser = await model.users.getById(req.payload.data.userId)
    if (user.length === 0) {
      await Mailing.organizationAccountCreate(
        req.body.email,
        req,
        magicId,
        sharedUser[0].email,
        organization.name,
        req.params.organizationId,
      )
    } else {
      user = await model.users.getById(user[0]._id, true)
      await Mailing.organizationInvite(
        user[0],
        req,
        sharedUser[0].email,
        organization.name,
        req.params.organizationId,
      )
    }

    const conversations = await model.conversations.getSharedConvFromOrga(
      req.params.organizationId,
      userId,
    )
    conversations.map(async (conv) => {
      conv.sharedWithUsers = conv.sharedWithUsers.filter(
        (u) => u.userId !== userId,
      )
      await model.conversations.update(conv)
    })

    res.status(201).send({
      message: req.body.email + " has been added to the organization",
    })
  } catch (err) {
    next(err)
  }
}

async function updateUserFromOrganization(req, res, next) {
  try {
    if (!req.params.organizationId || !req.body.userId || !req.body.role)
      throw new OrganizationUnsupportedMediaType()

    if (isNaN(req.body.role) && TYPES.checkValue(req.body.role))
      throw new OrganizationUnsupportedMediaType("Role value is not valid")
    if (ROLES.canGiveAccess(req.body.role, req.userRole))
      throw new OrganizationForbidden()

    let organization = await model.organizations.getById(
      req.params.organizationId,
    )
    if (organization.length === 0) throw new OrganizationNotFound()
    else organization = organization[0]

    const userRole = parseInt(req.body.role)

    if (
      organization.users.filter((oUser) => oUser.userId === req.body.userId)
        .length === 0
    )
      throw new OrganizationError(
        "User is not part of the " + organization.name,
      )

    organization.users.map((oUser) => {
      if (oUser.userId === req.body.userId) {
        if (ROLES.hasRoleAccess(req.userRole, oUser.role))
          // Update role need to be lower or equal than my current role
          oUser.role = userRole
        else throw new OrganizationForbidden()
        return
      }
    })

    const data = orgaUtility.countAdmin(organization, req.body.userId)
    if (data.adminCount === 0)
      throw new OrganizationForbidden("You cannot change the last admin role")

    const result = await model.organizations.update(organization)
    if (result.matchedCount === 0)
      throw new OrganizationError("Error while updating user in organization")

    user = await model.users.getById(req.body.userId, true)
    await Mailing.organizationRightUpdate(user[0], req, organization.name)

    res.status(200).send({
      message: "Updated user from the organization",
    })
  } catch (err) {
    next(err)
  }
}

async function deleteUserFromOrganization(req, res, next) {
  try {
    if (!req.params.organizationId || !req.body.userId)
      throw new OrganizationUnsupportedMediaType()

    let organization = await model.organizations.getById(
      req.params.organizationId,
    )
    if (organization.length === 0) throw new OrganizationNotFound()
    else organization = organization[0]

    let user = organization.users.filter(
      (oUser) => oUser.userId === req.body.userId,
    )

    if (user.length === 0)
      throw new OrganizationNotFound("User is not in " + organization.name)
    if (!ROLES.hasRevokeRoleAccess(user[0].role, req.userRole))
      throw new OrganizationForbidden() // Update role need to be lower or equal than my current role

    organization.users = organization.users.filter(
      (oUser) => oUser.userId !== req.body.userId,
    )

    const data = orgaUtility.countAdmin(organization, req.body.userId)
    if (data.adminCount === 0)
      throw new OrganizationForbidden("You cannot delete the last admin")

    const result = await model.organizations.update(organization)
    if (result.matchedCount === 0) throw new OrganizationError()

    user = await model.users.getById(req.body.userId, true)
    await Mailing.organizationDelete(user[0], req, organization.name)

    res.status(200).send({
      message: "User has been deleted from the organization",
    })
  } catch (err) {
    next(err)
  }
}

async function deleteConversationFromOrganization(req, res, next) {
  try {
    if (!req.params.organizationId) throw new OrganizationUnsupportedMediaType()

    let organization = await model.organizations.getById(
      req.params.organizationId,
    )
    if (organization.length === 0) throw new OrganizationNotFound()
    else organization = organization[0]

    if (!req.body.conversationsId) throw new OrganizationUnsupportedMediaType()
    const convIds = req.body.conversationsId.split(",")
    const userId = req.payload.data.userId

    let conversations = await model.conversations.listConvFromConvIds(
      convIds,
      userId,
      ROLES.MAINTAINER,
      RIGHTS.DELETE,
      req.query,
    )

    for (let conv of conversations.list) {
      await updateChildConversation(conv, "DELETE")

      const result = await model.conversations.delete(conv._id)
      if (result.deletedCount !== 1)
        throw new ConversationError(
          "Error when deleting conversation ",
          conv._id,
        )

      if (conv[0]?.metadata?.audio) {
        deleteFile(`${getStorageFolder()}/${conv.metadata.audio.filepath}`)
      }

      await model.conversationSubtitles.deleteAllFromConv(conv._id.toString())
      const categoryList = await model.categories.getByScope(
        conv._id.toString(),
      )
      for (const category of categoryList) {
        model.categories.delete(category._id)
        model.tags.deleteAllFromCategory(category._id.toString())
      }
    }

    if (conversations.count === convIds.length) {
      res.status(200).send({
        message: "Conversation has been deleted from the organization",
      })
    } else if (conversations.count === 0) {
      throw new ConversationError(
        `Error when deleting conversation : ${convIds}`,
      )
    } else {
      let message = "Conversation has been deleted from the organization :"
      conversations.list.map((c) => {
        message += " " + c._id
      })

      res.status(200).send({
        message,
      })
    }
  } catch (err) {
    next(err)
  }
}

module.exports = {
  addUserInOrganization,
  updateUserFromOrganization,
  deleteUserFromOrganization,
  deleteConversationFromOrganization,
}
