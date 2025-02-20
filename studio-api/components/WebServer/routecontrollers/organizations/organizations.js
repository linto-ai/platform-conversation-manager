const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:organizations",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)
const PLATFORM_ROLES = require(`${process.cwd()}/lib/dao/users/platformRole`)

const {
  OrganizationError,
  OrganizationUnsupportedMediaType,
  OrganizationConflict,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)

async function createOrganization(req, res, next) {
  try {
    if (!req.body.name) throw new OrganizationUnsupportedMediaType()

    const organization = {
      name: req.body.name,
      description: req.body.description ? req.body.description : "",
      users: [{ userId: req.payload.data.userId, role: ROLES.ADMIN }],
      owner: req.payload.data.userId,
      token: "",
    }

    if (!!req.body.users) organization.users.push(...req.body.users)

    const result = await model.organizations.create(organization)
    if (result.insertedCount !== 1) throw new OrganizationError()

    const orga_created = await model.organizations.getById(
      result.insertedId.toString(),
    )
    return res.status(201).send(orga_created[0])
  } catch (err) {
    next(err)
  }
}

async function getOrganization(req, res, next) {
  try {
    if (!req.params.organizationId) throw new OrganizationUnsupportedMediaType()

    const lorganization = await model.organizations.getByIdAndUser(
      req.params.organizationId,
      req.payload.data.userId,
    )
    if (lorganization.length !== 1) throw new OrganizationError()

    let organization = lorganization[0]
    let orgaUser = []
    for (let luser of organization.users) {
      let user = await model.users.getById(luser.userId)

      orgaUser.push({
        ...user[0],
        ...luser,
      })
    }
    organization.users = orgaUser
    return res.status(200).send(organization)
  } catch (err) {
    next(err)
  }
}

async function listSelfOrganization(req, res, next) {
  try {
    let organizations = await model.organizations.listSelf(
      req.payload.data.userId,
    )
    return res.status(200).send(organizations)
  } catch (err) {
    next(err)
  }
}

async function listAllOrganization(req, res, next) {
  try {
    let user = await model.users.getById(req.payload.data.userId, true)
    let organizations = []
    if (
      PLATFORM_ROLES.hasPlatformRoleAccess(
        user[0].role,
        PLATFORM_ROLES.SYSTEM_ADMINISTRATOR,
      )
    ) {
      organizations = await model.organizations.getAll()
    } else {
      return res.status(401).sned({ message: "Unauthorized" })
    }

    return res.status(200).send(organizations)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createOrganization,
  listSelfOrganization,
  listAllOrganization,
  getOrganization,
}
