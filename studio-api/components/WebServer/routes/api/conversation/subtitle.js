const debug = require("debug")(
  "linto:conversation-manager:router:api:conversation:conversations",
)

const {
  generateSubtitle,
  getSubtitle,
  deleteScreen,
  updateScreen,
  addScreen,
  listVersion,
  updateSubtitle,
  deleteSubtitle,
  deleteManySubtitle,
  copySubtitle,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/conversation/subtitle.js`,
)

// Need to be conversationId to manage access right with the access middleware
module.exports = (webserver) => {
  return [
    /*Require Auth */
    {
      path: "/:conversationId/subtitle/:subtitleId/screen/:screenId",
      method: "delete",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: deleteScreen,
    },
    {
      path: "/:conversationId/subtitle/:subtitleId/screen/:screenId",
      method: "patch",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: updateScreen,
    },
    {
      path: "/:conversationId/subtitle/:subtitleId/screen/:screenId",
      method: "post",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: addScreen,
    },
    {
      path: "/:conversationId/subtitle/:subtitleId/copy",
      method: "post",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: copySubtitle,
    },
    {
      path: "/:conversationId/subtitle/:subtitleId",
      method: "get",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: getSubtitle,
    },
    {
      path: "/:conversationId/subtitle/:subtitleId",
      method: "patch",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: updateSubtitle,
    },
    {
      path: "/:conversationId/subtitle/:subtitleId",
      method: "delete",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: deleteSubtitle,
    },
    {
      path: "/:conversationId/subtitle",
      method: "delete",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: deleteManySubtitle,
    },
    {
      path: "/:conversationId/subtitle",
      method: "post",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: generateSubtitle,
    },
    {
      path: "/:conversationId/subtitle",
      method: "get",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: listVersion,
    },
  ]
}
