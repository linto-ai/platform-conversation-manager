const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:error:handler",
)
const appLogger = require(`${process.cwd()}/lib/logger/logger.js`)

const fs = require("fs")

const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)

const JWT_DEFAULT_EXCEPTION = "UnauthorizedError" // Default JWT exception
const EXCEPTION_FOLDER = `${process.cwd()}/components/WebServer/error/exception/`

let init = function (webserver) {
  //Handle controller exception has API output
  let customException = [JWT_DEFAULT_EXCEPTION]

  fs.readdirSync(EXCEPTION_FOLDER).forEach((file) => {
    const Exception = require(`${EXCEPTION_FOLDER}${file}`)
    Object.keys(Exception).forEach((key) => customException.push(key))
  })

  webserver.express.use(function (err, req, res, next) {
    if (customException.indexOf(err.name) > -1) {
      formatError(req, err, true)

      const status = parseInt(err.status)
      if (isNaN(status)) {
        res.status(500).send({ message: err.message })
      } else {
        res.status(status).send({ message: err.message })
      }
      return
    } else if (err) {
      formatError(req, err, false)
      res.status(500).send({ message: err.message })
      return
    }
    next()
  })
}

function formatError(req, err, serverError = false) {
  let logger_message = `[${Date.now()}] - Handler | ${req.method} : ${req.url}`
  if (req?.payload?.data?.userId)
    logger_message += ` | { ${ROLE.print(req.payload.data.role)} : ${req.payload.data.userId} }`

  if (req.payload?.data?.role > 1) appLogger.info(logger_message)
  else appLogger.warn(logger_message)

  if (serverError) {
    appLogger.warn(err)
  } else {
    appLogger.error(err.stack) // Server error
  }
}
module.exports = {
  init,
}
