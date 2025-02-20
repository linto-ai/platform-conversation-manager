const debug = require("debug")(
  "linto:conversation-manager:router:api:conversation:share",
)

const {
  // Create conversation based on file
  getRightsByConversation,
  updateConversationRights,
  listSharedConversation,
  inviteUserByEmail,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/conversation/share.js`,
)

const {
  // Create conversation based on file
  listShareTags,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/taxonomy/conversations/share.js`,
)

const {
  // Create conversation based on file
  batchShareConversation,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/conversation/shareBatch.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/shared",
      method: "get",
      requireAuth: true,
      controller: listSharedConversation,
    },
    {
      path: "/shared/tags",
      method: "get",
      requireAuth: true,
      controller: listShareTags,
    },

    /*Require Conversation Access */
    {
      path: "/:conversationId/rights",
      method: "get",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: getRightsByConversation,
    },
    {
      path: "/:conversationId/users/:userId",
      method: "patch",
      requireAuth: true,
      requireConversationShareAccess: true,
      controller: updateConversationRights,
    },
    {
      path: "/:conversationId/invite",
      method: "post",
      requireAuth: true,
      requireConversationShareAccess: true,
      controller: inviteUserByEmail,
    },
    {
      path: "/shared/access",
      method: "post,patch,delete",
      requireAuth: true,
      // requireConversationShareAccess: true,
      controller: batchShareConversation,
    },
  ]
}
