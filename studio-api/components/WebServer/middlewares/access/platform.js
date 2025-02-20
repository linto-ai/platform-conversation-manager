const debug = require("debug")(
  "linto:conversation-manager:components:webserver:middlewares:access:platform",
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)
const ORGANIZATION_ROLE = require(`${process.cwd()}/lib/dao/organization/roles`)

const { UserForbidden, UserNotFound } = require(
  `${process.cwd()}/components/WebServer/error/exception/users`,
)

module.exports = {
  isPlatformAdmin: async (req, res, next) => {
    if (await checkAccess(req, ROLE.SUPER_ADMINISTRATOR)) next()
    else next(new UserForbidden())
  },
  isPlatformSystemAdministrator: async (req, res, next) => {
    if (await checkAccess(req, ROLE.SYSTEM_ADMINISTRATOR)) next()
    else next(new UserForbidden())
  },
  isPlatformSessionOperator: async (req, res, next) => {
    if (await checkAccess(req, ROLE.SESSION_OPERATOR)) next()
    else next(new UserForbidden())
  },
  isPlatformOrganizationInitiator: async (req, res, next) => {
    if (await checkAccess(req, ROLE.ORGANIZATION_INITIATOR)) next()
    else next(new UserForbidden())
  },
  isSuperAdmin: (req) => checkAccess(req, ROLE.SUPER_ADMINISTRATOR),
  isSystemAdministrator: (req) => checkAccess(req, ROLE.SYSTEM_ADMINISTRATOR),
  isSessionOperator: (req) => checkAccess(req, ROLE.SESSION_OPERATOR),
  isOrganizationInitiator: (req) =>
    checkAccess(req, ROLE.ORGANIZATION_INITIATOR),
}

async function checkAccess(req, role) {
  try {
    const { userId } = req.payload.data
    const user = await model.users.getById(userId, true)
    if (user.length === 0) return false

    const userRole = user[0].role
    if (userRole && ROLE.hasPlatformRoleAccess(userRole, role)) {
      if (ROLE.ORGANIZATION_INITIATOR === role) {
        return true // No impersonate require for organization initiator
      } else if (req.query.impersonateUser) {
        impersonate(req, req.query.impersonateUser)
      } else if (req.query.userScope === "backoffice") {
        await impersonateOwner(req) // Only impersonate if the user has a super role
      } else {
        return false // Normal user access behavior
      }
      return true
    }

    return false
  } catch (err) {
    return false
  }
}

async function impersonateOwner(req) {
  const { organizationId, conversationId } = req.params
  if (req.url.includes("/users/self/")) {
    return
  }
  if (organizationId) {
    await setOrganizationOwnerAsUser(req, organizationId)
  } else if (conversationId) {
    const conversation = await model.conversations.getById(conversationId)
    if (conversation.length > 0) {
      const orgId = conversation[0].organization.organizationId
      await setOrganizationOwnerAsUser(req, orgId)
    }
  }
}

async function setOrganizationOwnerAsUser(req, organizationId) {
  const organization = await model.organizations.getById(organizationId)
  if (organization.length > 0) {
    impersonate(req, organization[0].owner)
  }
}

function impersonate(req, userId) {
  req.userRole = ORGANIZATION_ROLE.ADMIN
  req.payload.data.adminId = req.payload.data.userId
  req.payload.data.userId = userId
}
