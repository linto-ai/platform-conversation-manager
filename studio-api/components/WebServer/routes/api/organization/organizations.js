const debug = require("debug")(
  "linto:conversation-manager:router:api:organizations:organizations",
)
const { createOrganization, listSelfOrganization, getOrganization } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/organizations/organizations.js`,
)

const { listConversationFromOrganization, leaveSelfFromOrganization } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/organizations/member.js`,
)

const PERMISSIONS = require(`${process.cwd()}/lib/dao/organization/permissions`)

const {
  addUserInOrganization,
  updateUserFromOrganization,
  deleteUserFromOrganization,
  deleteConversationFromOrganization,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/organizations/maintainer.js`,
)

const { updateOrganization, deleteOrganization } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/organizations/admin.js`,
)

const { transcribeReq } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/organizations/uploader/transcriptor.js`,
)

const { importConversation } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/organizations/uploader/import.js`,
)

module.exports = (webserver) => {
  return [
    /* No right*/
    {
      path: "/",
      method: "post",
      requireAuth: true,
      controller: createOrganization,
      requireOrganizationInitiatorAccess: true,
    },
    {
      path: "/",
      method: "get",
      requireAuth: true,
      controller: listSelfOrganization,
    },
    /*Member right */
    {
      path: "/:organizationId",
      method: "get",
      requireAuth: true,
      requireOrganizationMemberAccess: true,
      controller: getOrganization,
    },
    {
      path: "/:organizationId/self",
      method: "delete",
      requireAuth: true,
      requireOrganizationMemberAccess: true,
      controller: leaveSelfFromOrganization,
    },
    {
      path: "/:organizationId/conversations",
      method: "get",
      requireAuth: true,
      requireOrganizationMemberAccess: true,
      controller: listConversationFromOrganization,
    },

    /*Uploader right */
    {
      path: "/:organizationId/conversations/create",
      method: "post",
      requireAuth: true,
      requireOrganizationUploaderAccess: true,
      orgaPermissionAccess: PERMISSIONS.UPLOAD,
      controller: transcribeReq,
    },
    {
      path: "/:organizationId/conversations/import",
      method: "post",
      requireAuth: true,
      requireOrganizationUploaderAccess: true,
      orgaPermissionAccess: PERMISSIONS.UPLOAD,
      controller: importConversation,
    },

    /* Maintainer right*/
    {
      path: "/:organizationId/users",
      method: "post",
      requireAuth: true,
      requireOrganizationMaintainerAccess: true,
      controller: addUserInOrganization,
    },
    {
      path: "/:organizationId/users",
      method: "patch",
      requireAuth: true,
      requireOrganizationMaintainerAccess: true,
      controller: updateUserFromOrganization,
    },
    {
      path: "/:organizationId/users",
      method: "delete",
      requireAuth: true,
      requireOrganizationMaintainerAccess: true,
      controller: deleteUserFromOrganization,
    },
    {
      path: "/:organizationId/conversations",
      method: "delete",
      requireAuth: true,
      requireOrganizationMaintainerAccess: true,
      controller: deleteConversationFromOrganization,
    },

    /* Admin right*/
    {
      path: "/:organizationId",
      method: "patch",
      requireAuth: true,
      requireOrganizationAdminAccess: true,
      controller: updateOrganization,
    },
    {
      path: "/:organizationId",
      method: "delete",
      requireAuth: true,
      requireOrganizationAdminAccess: true,
      controller: deleteOrganization,
    },
  ]
}
