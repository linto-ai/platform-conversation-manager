const debug = require("debug")("linto:conversation-manager:routes:auth")

const { logout, recoveryAuth } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/users/users.js`,
)

module.exports = (webServer) => {
  return [
    {
      path: "/logout",
      method: "get",
      requireAuth: true,
      controller: logout,
    },
    {
      path: "/isAuth",
      method: "get",
      requireAuth: true,
      controller: async (req, res, next) => {
        res.status(200).send("Ok")
      },
    },
    {
      path: "/recovery",
      method: "post",
      requireAuth: false,
      controller: recoveryAuth,
    },
    {
      path: "/list",
      method: "get",
      requireAuth: false,
      controller: (req, res, next) => {
        let list = []
        if (process.env.LOCAL_AUTH_ENABLED === "true") {
          list.push({ path: "local", from: "studio", name: "studio" })
        }
        if (process.env.OIDC_TYPE !== "") {
          list.push({
            path: "oidc",
            from: process.env.OIDC_TYPE,
            name: process.env.OIDC_TYPE,
          })
        }

        res.status(200).send(list)
      },
    },
  ]
}
