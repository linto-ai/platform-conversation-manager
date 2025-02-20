const debug = require("debug")(
  "linto:conversation-manager:components:webserver:config:auth:refresh",
)

const jwtDecode = require("jwt-decode")

const TokenGenerator = require("./generator")
const model = require(`${process.cwd()}/lib/mongodb/models/index`)

const randomstring = require("randomstring")

module.exports = async function (refreshToken) {
  const decodedToken = jwtDecode(refreshToken)

  const userId = decodedToken.data.userId
  model.tokens.delete(decodedToken.data.tokenId)

  const token_salt = randomstring.generate(12)
  let token = await model.tokens.insert(userId, token_salt)

  // Data stored in the token
  const tokenData = {
    salt: token_salt,
    tokenId: token.insertedId,
    userId: userId,
    email: decodedToken.data.email,
  }
  return TokenGenerator(tokenData)
}
