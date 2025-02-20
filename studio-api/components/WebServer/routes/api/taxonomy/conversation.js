const debug = require("debug")(
  "linto:conversation-manager:router:api:taxonomy:conversation",
)

const { removeTagFromConversation, addTagToConversation } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/taxonomy/conversations/tag.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/conversations/:conversationId/tags,/conversations/:conversationId/tags/:tagId",
      method: "post",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: addTagToConversation,
    },
    {
      path: "/conversations/:conversationId/tags,/conversations/:conversationId/tags/:tagId",
      method: "patch",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: addTagToConversation,
    },
    {
      path: "/conversations/:conversationId/tags/:tagId",
      method: "delete",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: removeTagFromConversation,
    },
  ]
}
