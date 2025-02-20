const debug = require("debug")(
  "linto:conversation-manager:components:webserver:config:passport:tokenGenerator",
)

const jwt = require("jsonwebtoken")
const algorithm = process.env.JWT_ALGORITHM || "HS256"

const DEFAULT_TOKEN_EXPIRATION = "7d"
const DEFAULT_REFRESH_TOKEN_EXPIRATION = "14d"

module.exports = function generateTokens(
  tokenData,
  generatingOptions = { refresh: true },
) {
  const { salt, ...payload } = tokenData
  delete tokenData.salt

  const authSecret = salt + process.env.CM_JWT_SECRET

  // Generate the tokens
  const tokens = {
    auth_token: generateJWT(payload, authSecret, generatingOptions.expires_in),
    user_id: payload.userId,
  }

  if (generatingOptions.refresh) {
    tokens.refresh_token = generateJWT(
      payload,
      authSecret + process.env.CM_REFRESH_SECRET,
      generatingOptions.expires_in ||
        process.env.REFRESH_TOKEN_DAYS_TIME ||
        DEFAULT_REFRESH_TOKEN_EXPIRATION,
    )
  }

  return tokens
}

// Helper function to generate a single JWT
function generateJWT(payload, secret, expiresIn) {
  return jwt.sign({ data: payload }, secret, {
    algorithm: algorithm,
    expiresIn:
      expiresIn || process.env.TOKEN_DAYS_TIME || DEFAULT_TOKEN_EXPIRATION,
  })
}
