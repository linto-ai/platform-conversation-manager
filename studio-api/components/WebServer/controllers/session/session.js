const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:session:sessions`,
)
const { SessionError } = require(
  `${process.cwd()}/components/WebServer/error/exception/session`,
)

async function forceQueryParams(req, next) {
  try {
    if (req.body && Object.keys(req.body).length !== 0) {
      req.body.name = "@" + req.payload.data.userId
      req.body.visibility = "private"
      req.query.organizationId = req.params.organizationId || ""

      if (req.body.channel && req.body.channels.length === 1)
        throw new SessionError("Channel is required")
    } else {
      req.query.searchName = "@" + req.payload.data.userId || ""
      req.query.organizationId = req.params.organizationId || ""
    }

    next()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  forceQueryParams,
}
