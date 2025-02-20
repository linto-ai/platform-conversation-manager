const debug = require("debug")(
  "linto:conversation-manager:components:webserver:middlewares:access:organization",
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const platformAccess = require(`./platform`)

const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)

const {
  OrganizationForbidden,
  OrganizationNotFound,
  OrganizationUnsupportedMediaType,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)

const PERMISSIONS = require(`${process.cwd()}/lib/dao/organization/permissions`)

module.exports = {
  asAdminAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        req,
        next,
        req.params.organizationId,
        req.payload.data.userId,
        ROLES.ADMIN,
      )
  },
  asMaintainerAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        req,
        next,
        req.params.organizationId,
        req.payload.data.userId,
        ROLES.MAINTAINER,
      )
  },
  asMeetingManagerAccess: async (req, res, next) => {
    if (await platformAccess.isSessionOperator(req)) next()
    else
      await access(
        req,
        next,
        req.params.organizationId,
        req.payload.data.userId,
        ROLES.MEETING_MANAGER,
      )
  },
  asQuickMeetingAccess: async (req, res, next) => {
    if (await platformAccess.isSessionOperator(req)) next()
    else
      await access(
        req,
        next,
        req.params.organizationId,
        req.payload.data.userId,
        ROLES.QUICK_MEETING,
      )
  },
  asUploaderAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) next()
    else
      await access(
        req,
        next,
        req.params.organizationId,
        req.payload.data.userId,
        ROLES.UPLOADER,
      )
  },
  asMemberAccess: async (req, res, next) => {
    if (await platformAccess.isSystemAdministrator(req)) return next()
    else
      await access(
        req,
        next,
        req.params.organizationId,
        req.payload.data.userId,
        ROLES.MEMBER,
      )
  },
  access: async (req, next, organizationId, userId, right) => {
    await access(req, next, organizationId, userId, right)
  },
  permissionUpload: async (req, res, next) => {
    await permissionAccess(req, res, next, PERMISSIONS.UPLOAD)
  },
  permissionSummary: async (req, res, next) => {
    await permissionAccess(req, res, next, PERMISSIONS.SUMMARY)
  },
  permissionSession: async (req, res, next) => {
    await permissionAccess(req, res, next, PERMISSIONS.SESSION)
  },
}

async function permissionAccess(req, res, next, access) {
  let organization
  if (req.params.organizationId) {
    organization = await model.organizations.getById(req.params.organizationId)
  } else if (req.params.conversationId && req.path.endsWith("/download")) {
    const allowDownloadFormat = ["json", "text", "verbatim"]
    if (allowDownloadFormat.includes(req.query.format)) {
      return next()
    }

    const conv = await model.conversations.getById(req.params.conversationId)
    if (conv.length !== 1) return next(new ConversationNotShared())
    organization = await model.organizations.getById(
      conv[0].organization.organizationId,
    )
  }

  if (organization.length !== 1) return next(new OrganizationNotFound())
  if (!PERMISSIONS.hasRightAccess(organization[0].permissions, access))
    return next(
      new OrganizationForbidden(
        "Organization does not have the required permission",
      ),
    )
  else next()
}

async function access(req, next, organizationId, userId, right) {
  try {
    if (!organizationId) {
      return next(new OrganizationUnsupportedMediaType())
    }
    const organization = await model.organizations.getById(organizationId)
    if (organization.length !== 1) return next(new OrganizationNotFound())
    else {
      const isUserFound = organization[0].users.filter(
        (user) =>
          user.userId === userId && ROLES.hasRoleAccess(user.role, right),
      )
      if (isUserFound.length !== 0) {
        if (req) req.userRole = isUserFound[0].role

        return next()
      } else return next(new OrganizationForbidden())
    }
  } catch (err) {
    return next(err)
  }
}
