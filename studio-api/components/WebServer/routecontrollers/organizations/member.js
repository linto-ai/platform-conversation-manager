const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:organizations:member",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const orgaUtility = require(
  `${process.cwd()}/components/WebServer/controllers/organization/utility`,
)

const RIGHT = require(`${process.cwd()}/lib/dao/conversation/rights`)
const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)

const {
  OrganizationError,
  OrganizationForbidden,
  OrganizationUnsupportedMediaType,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)

async function leaveSelfFromOrganization(req, res, next) {
  try {
    const userId = req.payload.data.userId
    if (!req.params.organizationId) throw new OrganizationUnsupportedMediaType()

    let organization = await model.organizations.getByIdAndUser(
      req.params.organizationId,
      userId,
    )
    if (organization.length === 0)
      throw new OrganizationError("You are not part of " + organization.name)

    const data = orgaUtility.countAdmin(organization[0], userId)
    if (data.adminCount === 1 && data.isAdmin)
      throw new OrganizationForbidden(
        "You cannot leave the organization because you are the last admin",
      )

    let new_users_list = organization[0].users.filter(
      (oUser) => oUser.userId !== userId,
    )

    const result = await model.organizations.update({
      _id: req.params.organizationId,
      users: new_users_list,
    })

    if (result.matchedCount === 0) throw new OrganizationError()

    res.status(200).send({
      message: "You have leaved the organization",
    })
  } catch (err) {
    next(err)
  }
}

async function listConversationFromOrganization(req, res, next) {
  try {
    req.query.paginate = false

    const userId = req.payload.data.userId
    if (!req.params.organizationId) throw new OrganizationUnsupportedMediaType()

    const organization = (
      await model.organizations.getByIdAndUser(
        req.params.organizationId,
        userId,
      )
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

    if (req.query.filter === "notags") {
      let categories = (
        await model.categories.getByScope(req.params.organizationId)
      ).map((category) => category._id.toString())
      let tags = (await model.tags.getTagByCategoryList(categories)).map(
        (tag) => tag._id.toString(),
      )
      req.query.tags = tags
    }

    let conversations = await model.conversations.listConvFromOrga(
      req.params.organizationId,
      userId,
      userRole,
      RIGHT.READ,
      req.query,
    )

    res.status(200).send(conversations)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listConversationFromOrganization,
  leaveSelfFromOrganization,
}
