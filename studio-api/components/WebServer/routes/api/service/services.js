const debug = require("debug")(
  "linto:conversation-manager:router:api:services:service",
)

const { getSaasServices, getLlmServices } = require(
  `${process.cwd()}/components/WebServer/routecontrollers/services/service.js`,
)

module.exports = (webserver) => {
  return [
    {
      path: "",
      method: "get",
      requireAuth: true,
      controller: getSaasServices,
    },
    {
      path: "/llm",
      method: "get",
      requireAuth: true,
      controller: getLlmServices,
    },
    {
      path: "/:scope",
      method: "get",
      requireAuth: true,
      controller: getSaasServices,
    },
  ]
}
