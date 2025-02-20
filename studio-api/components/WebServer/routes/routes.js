const debug = require("debug")("linto:webserver:routes")

module.exports = (webServer) => {
  let api_routes = {
    "/": require("./root")(webServer),
    "/healthcheck": require("./api/healthcheck/healthcheck")(webServer),
    "/auth": [...require("./auth/index.js")(webServer)],
    "/api/users/self/favorites": require("./api/users/favorites.js")(webServer),
    "/api/users": require("./api/users/users.js")(webServer),
    "/api/organizations": require("./api/organization/organizations")(
      webServer,
    ),
    "/api/organizations/:organizationId/categories":
      require("./api/organization/categories")(webServer),
    "/api/organizations/:organizationId/tags":
      require("./api/organization/tag")(webServer),
    "/api/conversations": [
      ...require("./api/conversation/share")(webServer),
      ...require("./api/conversation/conversations")(webServer),
      ...require("./api/conversation/turn")(webServer),
      ...require("./api/conversation/subtitle")(webServer),
    ],
    "/api": [
      ...require("./api/taxonomy/categories")(webServer), // Keep that way until frontend catches up
      ...require("./api/taxonomy/conversation")(webServer), // Keep that way until frontend catches up
      ...require("./api/taxonomy/tag")(webServer), // Keep that way until frontend catches up
      ...require("./api/media/media")(webServer),
      ...require("./api/taxonomy/metadata")(webServer),
    ],
    "/api/administration": [
      ...require("./api/administration/users")(webServer),
      ...require("./api/administration/organizations")(webServer),
    ],
    "/api/nlp": require("./api/nlp/nlp")(webServer),
    "/api/services": require("./api/service/services")(webServer, this),
  }

  let proxy_routes = []
  if (process.env.SESSION_API_ENDPOINT !== "") {
    proxy_routes.push(require("./proxy/sessions/session.js")(webServer))
  }

  if (process.env.LOCAL_AUTH_ENABLED === "true") {
    api_routes["/auth"] = [
      ...api_routes["/auth"],
      ...require("./auth/local.js")(webServer),
    ]
  }
  if (process.env.OIDC_TYPE !== "") {
    api_routes["/auth"] = [
      ...api_routes["/auth"],
      ...require("./auth/oidc.js")(webServer),
    ]
  }

  return {
    api_routes: api_routes,
    proxy_routes: proxy_routes,
  }
}
