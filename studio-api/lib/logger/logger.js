const { createLogger, format, transports } = require("winston")

const logFormat =
  process.env.LOG_FORMAT === "json"
    ? format.combine(format.timestamp(), format.json())
    : format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : ""
          return `${timestamp} [${level}]: ${message}${metaString}`
        }),
      )

const logger = createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: logFormat,
  transports: [new transports.Console()],
})

module.exports = logger
