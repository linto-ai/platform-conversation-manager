const config = {}

if (process.env.SESSION_API_ENDPOINT !== "") {
  Object.assign(config, require("./bots.json"))
  Object.assign(config, require("./sessions.json"))
}

module.exports = config
