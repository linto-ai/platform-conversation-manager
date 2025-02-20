const debug = require("debug")(
  "linto:conversation-manager:router:api:taxonomy:conversation",
)

const {
  getConvMetadata,
  getTagMetadata,
  createMetadata,
  deleteMetadata,
  updateMetadata,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/taxonomy/metadatas/metadata.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/conversations/:conversationId/metadata",
      method: "get",
      requireAuth: true,
      requireReadTaxonomyAccess: true,
      controller: getConvMetadata,
    },
    {
      path: "/conversations/:conversationId/tags/:tagId/metadata",
      method: "get",
      controller: getTagMetadata,
      requireAuth: true,
      requireWriteTaxonomyAccess: true,
    },
    {
      path: "/conversations/:conversationId/tags/:tagId/metadata",
      method: "post",
      controller: createMetadata,
      requireAuth: true,
      requireWriteTaxonomyAccess: true,
    },
    {
      path: "/conversations/:conversationId/tags/:tagId/metadata/:metadataId",
      method: "delete",
      controller: deleteMetadata,
      requireAuth: true,
      requireWriteTaxonomyAccess: true,
    },
    {
      path: "/conversations/:conversationId/tags/:tagId/metadata/:metadataId",
      method: "patch",
      controller: updateMetadata,
      requireAuth: true,
      requireWriteTaxonomyAccess: true,
    },
  ]
}
