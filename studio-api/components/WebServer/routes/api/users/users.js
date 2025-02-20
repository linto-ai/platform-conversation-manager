const debug = require("debug")(
  "linto:conversation-manager:router:api:user:user",
)
const {
  listUser,
  searchUser,
  createUser,
  getUserById,
  getPersonalInfo,
  updateUser,
  updateUserPicture,
  deleteUser,
  recoveryAuth,
  sendVerificationEmail,
} = require(
  `${process.cwd()}/components/WebServer/routecontrollers/users/users.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "/",
      method: "post",
      requireAuth: false,
      controller: createUser,
    },
    {
      path: "/",
      method: "get",
      requireAuth: true,
      controller: listUser,
    },
    {
      path: "/self",
      method: "get",
      requireAuth: true,
      controller: getPersonalInfo,
    },
    {
      path: "/self",
      method: "delete",
      requireAuth: true,
      controller: deleteUser,
    },
    {
      path: "/self",
      method: "put",
      requireAuth: true,
      controller: updateUser,
    },
    {
      path: "/self/picture",
      method: "put",
      requireAuth: true,
      controller: updateUserPicture,
    },
    {
      path: "/self/verify-email",
      method: "patch",
      requireAuth: true,
      controller: sendVerificationEmail,
    },
    {
      path: "/self/reset-password",
      method: "post",
      requireAuth: false,
      controller: recoveryAuth,
    },
    {
      path: "/search",
      method: "get",
      requireAuth: true,
      controller: searchUser,
    },
    {
      path: "/:userId",
      method: "get",
      requireAuth: true,
      requireUserVisibility: true,
      controller: getUserById,
    },
  ]
}
