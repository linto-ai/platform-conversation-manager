const debug = require("debug")(
  "linto:conversation-manager:router:api:keyword:keyword",
)
const { keywordExtract } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/keyword/keyword.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/conversations/:conversationId/keywords",
      method: "post",
      requireAuth: true,
      requireConversationWriteAccess: true,
      controller: keywordExtract,
    },
  ]
}
