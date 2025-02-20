const debug = require("debug")("linto:conversation-manager:routes:auth:oidc")

const { Unauthorized } = require(
  `${process.cwd()}/components/WebServer/error/exception/auth`,
)

const auth_middleware = require(
  `${process.cwd()}/components/WebServer/config/passport/local/middleware`,
)
var passport = require("passport")

module.exports = (webServer) => {
  return [
    {
      path: "/oidc/login",
      method: "get",
      requireAuth: false,
      controller: [auth_middleware.oidc_authenticate],
    },
    {
      path: "/oidc/cb",
      method: "get",
      requireAuth: false,
      controller: [
        passport.authenticate("oidc", {
          successReturnToOrRedirect:
            (process.env.FRONTEND_DOMAIN || "") + "/login/oidc",
          failureRedirect: "auth/login/oidc",
        }),
      ],
    },
    {
      path: "/oidc/token",
      method: "get",
      requireAuth: true,
      controller: [
        (req, res, next) => {
          if (req?.session?.passport?.user) {
            res.status(200).json(req.session.passport.user)
          } else {
            next(new Unauthorized())
          }
        },
      ],
    },
  ]
}
