const debug = require("debug")(
  "linto:conversation-manager:router:api:organizations:organizations",
)
const {
  listAllOrganization,
  createOrganization,
  updateOrganizationPlatform,
  inviteMatchingMail,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/administration/organizations.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/organizations",
      method: "get",
      requireAuth: true,
      requireSystemAdministrator: true,
      controller: listAllOrganization,
    },
    {
      path: "/organizations",
      method: "post",
      requireAuth: true,
      requireSystemAdministrator: true,
      controller: createOrganization,
    },
    {
      path: "/organizations/:organizationId",
      method: "patch",
      requireAuth: true,
      requireSystemAdministrator: true,
      controller: updateOrganizationPlatform,
    },
    {
      path: "/organizations/:organizationId/inviteMatchingMail",
      method: "post",
      requireAuth: true,
      requireSystemAdministrator: true,
      controller: inviteMatchingMail,
    },
  ]
}
