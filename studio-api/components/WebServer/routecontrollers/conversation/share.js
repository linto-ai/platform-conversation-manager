const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:conversation:share`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const RIGHTS = require(`${process.cwd()}/lib/dao/conversation/rights`)
const Mailing = require(`${process.cwd()}/lib/mailer/mailing`)

const conversationUtility = require(
  `${process.cwd()}/components/WebServer/controllers/conversation/utility`,
)
const { updateChildConversation } = require(
  `${process.cwd()}/components/WebServer/controllers/conversation/child`,
)

const {
  ConversationIdRequire,
  ConversationNotFound,
  ConversationMetadataRequire,
  ConversationError,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

const { UserNotFound, UserError } = require(
  `${process.cwd()}/components/WebServer/error/exception/users`,
)

async function getRightsByConversation(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()

    const conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (conversation.length !== 1) throw new ConversationNotFound()

    const data = await conversationUtility.getUserRightFromConversation(
      req.payload.data.userId,
      conversation[0],
    )
    res.status(200).send(data)
  } catch (err) {
    next(err)
  }
}

async function updateConversationRights(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    if (req.body.right === undefined || !req.params.userId)
      throw new ConversationMetadataRequire("UserId is require")
    if (req.params.userId === req.payload.data.userId)
      throw new ConversationError("You can't change your own right")

    let user = await model.users.getById(req.params.userId, true)
    if (user.length !== 1) throw new UserNotFound()
    user = user[0]

    let conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (conversation.length !== 1) throw new ConversationNotFound()
    conversation = conversation[0]

    const organization = await model.organizations.getById(
      conversation.organization.organizationId,
    )
    if (organization.length !== 1) throw new OrganizationNotFound()

    const isInOrga = organization[0].users.filter(
      (usr) => usr.userId === req.params.userId,
    )

    // Select user right in the conversation
    let userRight =
      isInOrga.length === 0
        ? conversation.sharedWithUsers
        : conversation.organization.customRights
    let isUpdated = false

    if (req.body.right === 0 && isInOrga.length === 0) {
      // Delete user from conversation rights that is not in the organization
      userRight = userRight.filter(
        (usr) => usr.userId !== req.params.userId.toString(),
      )
      isUpdated = true

      await Mailing.conversationUnshare(user, req, conversation.name)
    } else {
      const userIndex = userRight.findIndex(
        (usr) => usr.userId === req.params.userId.toString(),
      )
      if (userIndex >= 0) {
        // User have already acces to the conversation but right have change
        isUpdated = true
        userRight[userIndex].right = req.body.right
        userRight[userIndex].sharedBy = req.payload.data.userId

        let sharedBy = await model.users.getById(req.payload.data.userId)

        if (sharedBy.length !== 1) throw new UserNotFound()
        await Mailing.conversationRightUpdate(
          user,
          req,
          sharedBy[0].email,
          req.params.conversationId,
        )
      }
    }

    if (!isUpdated) {
      let sharedBy = await model.users.getById(req.payload.data.userId)
      if (sharedBy.length !== 1) throw new UserNotFound()

      Mailing.conversationShared(
        user,
        req,
        sharedBy[0].email,
        req.params.conversationId,
      )

      if (req.payload.data.adminId) {
        req.payload.data.userId = req.payload.data.adminId // if it's an admin that share the conversation
      }
      userRight.push({
        userId: req.params.userId.toString(),
        right: req.body.right,
        sharedBy: req.payload.data.userId,
      })
    }

    isInOrga.length === 0
      ? (conversation.sharedWithUsers = userRight)
      : (conversation.organization.customRights = userRight)

    const result = await model.conversations.update(conversation)
    await updateChildConversation(conversation, "RIGHTS")
    if (result.matchedCount === 0) throw new ConversationError()

    res.status(200).send({
      message: "Conversation updated",
    })
  } catch (err) {
    next(err)
  }
}

async function inviteNewUser(req, res, next) {
  try {
    if (process.env.DISABLE_USER_CREATION === "true")
      throw new UserError("User creation is disabled")

    const email = req.body.email
    const createdUser = await model.users.createExternal({ email })

    // Create new user personal organization
    if (createdUser.insertedCount !== 1) throw new UserError()
    const userId = createdUser.insertedId.toString()
    const magicId = createdUser.ops[0].authLink.magicId

    if (magicId) {
      const createOrganization = await model.organizations.createDefault(
        userId,
        email + "'s Organization",
        {},
      )
      if (createOrganization.insertedCount !== 1) {
        await model.users.delete(userId)
        throw new UserError()
      }

      // Share converation to created user
      const sharedBy = await model.users.getById(req.payload.data.userId)
      if (sharedBy.length !== 1) throw new UserNotFound()
      await Mailing.conversationSharedNewUser(
        email,
        req,
        magicId,
        sharedBy[0].email,
        req.params.conversationId,
      )

      await model.conversations.addSharedUser(req.params.conversationId, {
        userId,
        sharedBy: req.payload.data.userId,
        right: 1,
      })
    }

    res.status(200).send({
      message: "Invitation send",
    })
  } catch (err) {
    next(err)
  }
}

async function inviteUserByEmail(req, res, next) {
  if (req.body.right) req.body.right = parseInt(req.body.right)
  else req.body.right = RIGHTS.READ

  const user = await model.users.getByEmail(req.body.email)
  if (user.length === 1) {
    // Share to an internal user
    req.params.userId = user[0]._id.toString()
    updateConversationRights(req, res, next)
  } else {
    // Share to an external user
    inviteNewUser(req, res, next)
  }
}

async function listSharedConversation(req, res, next) {
  try {
    const userId = req.payload.data.userId
    let sharedConversation = await model.conversations.getByShare(
      userId,
      req.query,
    )
    sharedConversation.list = await conversationUtility.getUserRightByShare(
      userId,
      sharedConversation.list,
    )

    let shareBy = {} // used to not spam mongo

    for (let conv of sharedConversation.list) {
      for (let user of conv.sharedWithUsers) {
        if (user.userId === userId) {
          if (shareBy[user.sharedBy] === undefined) {
            const sharedBy = await model.users.getById(user.sharedBy)
            shareBy[user.sharedBy] = sharedBy[0]
          }
          conv.sharedBy = shareBy[user.sharedBy]
          break
        }
      }
      delete conv.organization
      delete conv.sharedWithUsers
    }

    if (sharedConversation.length === 0) res.status(204).send()
    else {
      res.status(200).send(sharedConversation)
    }
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getRightsByConversation,
  updateConversationRights,
  inviteUserByEmail,
  listSharedConversation,
}
