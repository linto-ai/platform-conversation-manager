const debug = require("debug")("app:webserver:middlewares")

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9
  const NS_TO_MS = 1e6
  const diff = process.hrtime(start)
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
}

// Logs requests url, method and execution time
function logger(req, res, next) {
  // On request start
  debug(`${req.method} ${req.originalUrl} [STARTED]`, req.body)
  const start = process.hrtime()

  // On request finish
  res.on("finish", () => {
    const durationInMilliseconds = getDurationInMilliseconds(start)
    debug(
      `${req.method} ${req.originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms`,
    )
  })

  // On request close
  res.on("close", () => {
    const durationInMilliseconds = getDurationInMilliseconds(start)
    debug(
      `${req.method} ${req.originalUrl} [CLOSED] ${durationInMilliseconds.toLocaleString()} ms`,
    )
  })
  next()
}

module.exports = {
  logger,
}
