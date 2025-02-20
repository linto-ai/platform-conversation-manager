const debug = require("debug")("linto:app:webserver:middlewares:logger")

const appLogger = require(`${process.cwd()}/lib/logger/logger.js`)
const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)

function logger(req, res, next) {
  let logger_message = `[${Date.now()}] - ${req.method} : ${req.url}`
  if (req.body && Object.keys(req.body).length > 0) {
    if (req.url == "/auth/login")
      logger_message += ` | {"email" : ${req.body.email}}`
    else logger_message += ` | ${JSON.stringify(req.body)}`
  }

  if (req?.payload?.data?.userId)
    logger_message += ` | { ${ROLE.print(req.payload.data.role)} : ${req.payload.data.userId} }`

  if (req?.payload?.data?.role > 1) appLogger.info(logger_message)
  else appLogger.debug(logger_message)

  // log 400 error
  const originalJson = res.json
  res.json = function (body) {
    if (body.error) {
      appLogger.warn(body.error)
    }
    return originalJson.call(this, body)
  }

  // log 404 error
  const originalSend = res.send
  res.send = function (body) {
    res.locals.responseBody = body
    return originalSend.call(this, body) // Continue le comportement normal
  }

  res.on("finish", () => {
    if (
      res.statusCode >= 400 &&
      res.statusCode < 500 &&
      res.locals.responseBody
    ) {
      appLogger.warn(res.locals.responseBody)
    }
  })

  next()
}

module.exports = {
  logger,
}
