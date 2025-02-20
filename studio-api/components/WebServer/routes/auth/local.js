const debug = require("debug")("linto:conversation-manager:routes:auth")

const { logout, recoveryAuth } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/users/users.js`,
)
const auth_middleware = require(
  `${process.cwd()}/components/WebServer/config/passport/local/middleware`,
)

module.exports = (webServer) => {
  return [
    {
      path: "/login",
      method: "post",
      requireAuth: false,
      controller: [
        auth_middleware.local_authenticate,
        (req, res, next) => {
          res.status(202).json(req.user)
        },
      ],
    },
    {
      path: "/refresh",
      method: "get",
      requireRefresh: true,
      controller: [
        auth_middleware.refresh,
        (req, res, next) => {
          res.status(202).json(req.user)
        },
      ],
    },
    {
      path: "/login/magic-link",
      method: "post",
      requireAuth: false,
      controller: [
        auth_middleware.authenticate_reset,
        (req, res, next) => {
          res.status(202).json(req.user)
        },
      ],
    },
  ]
}
