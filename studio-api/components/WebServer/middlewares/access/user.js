const debug = require("debug")(
  "linto:conversation-manager:components:webserver:middlewares:access:users",
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const platformAccess = require(`./platform`)

const { UserForbidden, UserNotFound } = require(
  `${process.cwd()}/components/WebServer/error/exception/users`,
)

module.exports = {
  isVisibility: async (req, res, next) => {
    try {
      if (await platformAccess.isSuperAdmin(req)) next()
      else {
        if (req.payload.data.userId === req.params.userId) next()
        else {
          model.users.getById(req.params.userId, true).then(async (user) => {
            if (user.length === 0) next(new UserNotFound())
            else if (!user[0].private) next()
            else next(new UserForbidden())
          })
        }
      }
    } catch (err) {
      return next(err)
    }
  },
}
