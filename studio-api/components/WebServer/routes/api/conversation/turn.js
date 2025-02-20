const debug = require("debug")(
  "linto:conversation-manager:router:api:conversation:turn",
)

const { addTurn, deleteTurn, updateTurn, mergeTurn, search } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/conversation/turn.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/:conversationId/turns/search",
      method: "get",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: search,
    },
    {
      path: "/:conversationId/turns/:turnId",
      method: "post",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: addTurn,
    },
    {
      path: "/:conversationId/turns/:turnId",
      method: "delete",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: deleteTurn,
    },
    {
      path: "/:conversationId/turns/:turnId",
      method: "patch",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: updateTurn,
    },
    {
      path: "/:conversationId/turns/:turnId/merge/:direction",
      method: "patch",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: mergeTurn,
    },
  ]
}
