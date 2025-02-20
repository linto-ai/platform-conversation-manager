const debug = require("debug")(
  "linto:conversation-manager:components:webserver:middlewares:access:conversation",
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const platformAccess = require(`./platform`)

const CONVERSATION_RIGHTS = require(
  `${process.cwd()}/lib/dao/conversation/rights`,
)
const ORGANIZATION_ROLES = require(
  `${process.cwd()}/lib/dao/organization/roles`,
)

const projection = ["owner", "sharedWithUsers", "organization"]

const {
  ConversationReadAccessDenied,
  ConversationWriteAccessDenied,
  ConversationShareAccessDenied,
  ConversationDeleteAccessDenied,
  ConversationNotShared,
  ConversationIdRequire,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

module.exports = {
  asReadAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        next,
        req.params.conversationId,
        req.payload.data.userId,
        false,
        CONVERSATION_RIGHTS.READ,
        ConversationReadAccessDenied,
      ) // ORGA MEMBER
  },
  asCommentAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        next,
        req.params.conversationId,
        req.payload.data.userId,
        false,
        CONVERSATION_RIGHTS.COMMENT,
        ConversationReadAccessDenied,
      ) // ORGA MAINTENER
  },
  asWriteAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        next,
        req.params.conversationId,
        req.payload.data.userId,
        false,
        CONVERSATION_RIGHTS.WRITE,
        ConversationWriteAccessDenied,
      ) // ORGA MAINTENER
  },
  asDeleteAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        next,
        req.params.conversationId,
        req.payload.data.userId,
        true,
        CONVERSATION_RIGHTS.DELETE,
        ConversationDeleteAccessDenied,
      ) // ORGA MAINTENER
  },
  asShareAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        next,
        req.params.conversationId,
        req.payload.data.userId,
        false,
        CONVERSATION_RIGHTS.SHARE,
        ConversationShareAccessDenied,
      )
  },
  access: async (
    req,
    next,
    convId,
    userId,
    restricted,
    right,
    rightException,
  ) => {
    return await access(next, convId, userId, restricted, right, rightException)
  },
}

async function access(next, convId, userId, restricted, right, rightException) {
  let nextCalled = false // if next is called, nextCalled is undefined

  try {
    if (!convId) return next(new ConversationIdRequire())
    else {
      const lconv = await model.conversations.getById(convId, projection)
      if (lconv.length !== 1) return next(new ConversationNotShared())
      else {
        const conv = lconv[0]
        if (conv.organization.organizationId === undefined)
          return next(new rightException())
        if (!restricted)
          nextCalled = await shareAccess(conv, userId, right, next, nextCalled)
        if (nextCalled !== undefined)
          nextCalled = await organizationAccess(
            conv,
            userId,
            right,
            next,
            rightException,
          )
      }
    }

    if (nextCalled === undefined) return
    else return next(new rightException())
  } catch (err) {
    return next(err)
  }
}

async function shareAccess(conv, userId, right, next) {
  if (conv.sharedWithUsers.length !== 0) {
    let ushare = conv.sharedWithUsers.filter(
      (userShare) =>
        userShare.userId === userId &&
        CONVERSATION_RIGHTS.hasRightAccess(userShare.right, right),
    )
    if (ushare.length === 1) return next()
  }
  return false
}

async function organizationAccess(conv, userId, right, next, rightException) {
  const lorga = await model.organizations.getById(
    conv.organization.organizationId,
  )
  if (lorga.length !== 1) return next(new rightException())

  const luser = lorga[0].users.filter((user) => user.userId === userId)
  if (luser.length !== 1) next(new ConversationNotShared())
  else {
    const user = luser[0] // user right in organization
    if (
      ORGANIZATION_ROLES.hasRoleAccess(user.role, ORGANIZATION_ROLES.MAINTAINER)
    ) {
      // MAINTAINER or above
      return next()
    } else if (conv.organization.customRights.length !== 0) {
      // Custom rights for specific member
      let customRight = conv.organization.customRights.filter(
        (orgaCustomRight) => orgaCustomRight.userId === userId,
      )

      if (customRight.length === 1) {
        if (CONVERSATION_RIGHTS.hasRightAccess(customRight[0].right, right))
          return next()
        else return next(new rightException())
      }
    }

    // Member got right to share
    if (
      CONVERSATION_RIGHTS.hasRightAccess(conv.organization.membersRight, right)
    )
      return next()
    else return next(new ConversationNotShared())
  }

  return false
}
