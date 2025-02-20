const debug = require("debug")(
  "linto:conversation-manager:router:api:tag:categories",
)
const { updateCategory, deleteCategory } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/taxonomy/categories/categories.js`,
)

//path allways preceded by /api/organizations/:organizationId/category
module.exports = (webserver) => {
  return [
    {
      path: "/:categoryId",
      method: "patch",
      controller: updateCategory,
      requireAuth: true,
      requireOrganizationMaintainerAccess: true,
    },
    {
      path: "/:categoryId",
      method: "delete",
      controller: deleteCategory,
      requireAuth: true,
      requireOrganizationMaintainerAccess: true,
    },
  ]
}
