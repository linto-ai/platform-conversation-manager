const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:controller:organizations:utility",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const { OrganizationNotFound, OrganizationError } = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)
const { ConversationIdRequire, ConversationNotFound } = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

const RIGHT = require(`${process.cwd()}/lib/dao/conversation/rights`)
const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)

function countAdmin(organization, userId) {
  let adminCount = 0
  let isAdmin = false
  for (let oUser of organization.users) {
    if (oUser.role === ROLES.ADMIN) adminCount++
    if (oUser.userId === userId && oUser.role === ROLES.ADMIN) isAdmin = true
  }

  return {
    userCount: organization.users.length,
    adminCount,
    isAdmin,
  }
}

async function getUserConversationFromOrganization(userId, organizationId) {
  const organization = (
    await model.organizations.getByIdAndUser(organizationId, userId)
  )[0]
  if (!organization)
    throw new OrganizationError("You are not part of " + organization.name)

  let userRole = ROLES.MEMBER
  organization.users.map((oUser) => {
    if (oUser.userId === userId) {
      userRole = oUser.role
      return
    }
  })
  const projection = {
    speakers: 0,
    keywords: 0,
    highlights: 0,
  }
  const conversations = await model.conversations.getByOrga(
    organizationId,
    projection,
  )

  let listConv = conversations
    .filter((conv) => {
      let access = conv.organization.customRights.find(
        (customRight) => customRight.userId === userId,
      )
      if (access && RIGHT.hasRightAccess(access.right, RIGHT.READ)) {
        return conv
      } else if (!access && ROLES.hasRoleAccess(userRole, ROLES.MAINTAINER)) {
        return conv
      } else if (
        RIGHT.hasRightAccess(conv.organization.membersRight, RIGHT.READ)
      ) {
        return conv
      }
    })
    .filter((conv) => conv !== undefined)

  return listConv
}

async function getOrgaIdFromReq(req) {
  let organizationId = req.params.organizationId

  if (organizationId === undefined) {
    if (!req.params.conversationId)
      throw new ConversationIdRequire("Conversation id is required")

    const conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (conversation.length !== 1) throw new ConversationNotFound()

    organizationId = conversation[0].organization.organizationId
  }

  return organizationId
}

// Add user to all organization with the same email domain
async function populateUserToOrganization(user) {
  const matchingMail = "@" + user.email.split("@")[1]

  const organizations = await model.organizations.getAll({
    matchingMail: matchingMail,
  })
  organizations.list.forEach(async (organization) => {
    if (
      organization.users.filter((u) => u.userId === user._id.toString())
        .length === 0
    ) {
      let orgaCopy = JSON.parse(JSON.stringify(organization))
      orgaCopy.users.push({ userId: user._id.toString(), role: ROLES.MEMBER })
      await model.organizations.update(orgaCopy)
    }
  })
}

module.exports = {
  getOrgaIdFromReq,
  countAdmin,
  getUserConversationFromOrganization,
  populateUserToOrganization,
}
