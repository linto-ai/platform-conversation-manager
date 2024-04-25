const debug = require('debug')('linto:conversation-manager:components:webserver:middlewares:access:conversation')

const model = require(`${process.cwd()}/lib/mongodb/models`)

const CONVERSATION_RIGHTS = require(`${process.cwd()}/lib/dao/conversation/rights`)
const ORGANIZATION_ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)

const projection = ['owner', 'sharedWithUsers', 'organization']

const {
  ConversationReadAccessDenied,
  ConversationWriteAccessDenied,
  ConversationShareAccessDenied,
  ConversationDeleteAccessDenied,
  ConversationNotShared,
  ConversationIdRequire
} = require(`${process.cwd()}/components/WebServer/error/exception/conversation`)

module.exports = {
  asReadAccess: async (req, res, next) => {
    await accessConv(next, req.params.conversationId, req.payload.data.userId, false, CONVERSATION_RIGHTS.READ, ConversationReadAccessDenied) // ORGA MEMBER
  },
  asCommentAccess: async (req, res, next) => {
    await accessConv(next, req.params.conversationId, req.payload.data.userId, false, CONVERSATION_RIGHTS.COMMENT, ConversationReadAccessDenied) // ORGA MAINTENER
  },
  asWriteAccess: async (req, res, next) => {
    await accessConv(next, req.params.conversationId, req.payload.data.userId, false, CONVERSATION_RIGHTS.WRITE, ConversationWriteAccessDenied) // ORGA MAINTENER
  },
  asDeleteAccess: async (req, res, next) => {
    await accessConv(next, req.params.conversationId, req.payload.data.userId, true, CONVERSATION_RIGHTS.DELETE, ConversationDeleteAccessDenied) // ORGA MAINTENER
  },
  asDeleteMultipleAccess: async (req, res, next) => {
    await accessMultiple(next, req.body.conversations, req.payload.data.userId, false, CONVERSATION_RIGHTS.DELETE, ConversationShareAccessDenied)
  },
  asShareAccess: async (req, res, next) => {
    await accessConv(next, req.params.conversationId, req.payload.data.userId, false, CONVERSATION_RIGHTS.SHARE, ConversationShareAccessDenied)
  },
  asShareMultipleAccess: async (req, res, next) => {
    await accessMultiple(next, req.body.conversations, req.payload.data.userId, false, CONVERSATION_RIGHTS.SHARE, ConversationShareAccessDenied)
  },
  access: async (req, next, convId, userId, restricted, right, rightException) => {
    return await accessConv(next, convId, userId, restricted, right, rightException)
  }
}

async function accessMultiple(next, convIds, userId, restricted, right, rightException) {
  if (typeof convIds === 'string') convIds = convIds.split(',')
  else if (!Array.isArray(convIds)) return next(new ConversationIdRequire())

  let access = false
  for (const convId of convIds)
    access = await accessConv(next, convId, userId, restricted, right, rightException, true)
  if (access) next() // Next should not be called unless there is an error
}

async function accessConv(next, convId, userId, restricted, right, rightException, multiple = false) {
  let nextCalled = false // if next is called, nextCalled is undefined

  try {
    if (!convId) return next(new ConversationIdRequire())
    else {
      const lconv = await model.conversations.getById(convId, projection)
      if (lconv.length !== 1) return next(new ConversationNotShared())
      else {
        const conv = lconv[0]
        if (conv.organization.organizationId === undefined) return next(new rightException())
        if (!restricted) nextCalled = await shareAccess(conv, userId, right, next, nextCalled, multiple)
        if (nextCalled !== undefined) nextCalled = await organizationAccess(conv, userId, right, next, rightException, multiple)
      }
    }

    if (nextCalled === true && !multiple) return
    else if (!multiple) return next(new rightException())

  } catch (err) {
    return next(err)
  }
  return true
}

async function shareAccess(conv, userId, right, next, multiple) {
  if (conv.sharedWithUsers.length !== 0) {
    let ushare = conv.sharedWithUsers.filter(userShare => userShare.userId === userId && CONVERSATION_RIGHTS.hasRightAccess(userShare.right, right))
    if (ushare.length === 1) {
      if (!multiple) {
        next()
        return true
      } return false
    }
  }
  return false
}

async function organizationAccess(conv, userId, right, next, rightException, multiple) {
  const lorga = await model.organizations.getById(conv.organization.organizationId)
  if (lorga.length !== 1) {
    next(new rightException())
    return true
  }

  const luser = lorga[0].users.filter(user => user.userId === userId)
  if (luser.length !== 1) {
    next(new ConversationNotShared())
    return true
  } else {
    const user = luser[0] // user right in organization
    if (ORGANIZATION_ROLES.hasRoleAccess(user.role, ORGANIZATION_ROLES.MAINTAINER)) { // MAINTAINER or above
      if (!multiple) {
        next()
        return true
      } return false
    } else if (conv.organization.customRights.length !== 0) { // Custom rights for specific member
      let customRight = conv.organization.customRights.filter(orgaCustomRight => orgaCustomRight.userId === userId)

      if (customRight.length === 1) {
        if (CONVERSATION_RIGHTS.hasRightAccess(customRight[0].right, right)) {
          if (!multiple) {
            next()
            return true
          } return false
        } else {
          next(new rightException())
          return true
        }
      }

      // Member got right to share
      if (CONVERSATION_RIGHTS.hasRightAccess(conv.organization.membersRight, right)) {
        if (!multiple) {
          next()
          return true
        } return false
      }
      else {
        next(new ConversationNotShared())
        return true
      }
    }

    return false
  }
}