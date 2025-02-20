const debug = require("debug")(
  "linto:conversation-manager:router:api:user:user",
)
const { addFav, deleteFav, listFav, listFavTags } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/users/favorites.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/",
      method: "get",
      requireAuth: true,
      controller: listFav,
    },
    {
      path: "/tags",
      method: "get",
      requireAuth: true,
      controller: listFavTags,
    },
    {
      path: "/:conversationId",
      method: "put",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: addFav,
    },
    {
      path: "/:conversationId",
      method: "delete",
      requireAuth: true,
      controller: deleteFav,
    },
  ]
}
