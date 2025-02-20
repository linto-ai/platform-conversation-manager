const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:controller:services:utility",
)
const { ServiceError } = require(
  `${process.cwd()}/components/WebServer/error/exception/service`,
)

const axios = require(`${process.cwd()}/lib/utility/axios`)

async function listSaasServices(scope) {
  try {
    const gateway_services = process.env.GATEWAY_SERVICES
    let services = []

    let host = gateway_services + "/gateway/services"
    if (scope) host += `/${scope}`

    const saas_service_info = await axios.get(host)
    for (const transcription_service of saas_service_info.transcription) {
      services.push(transcription_service)
    }

    for (const nlp_service of saas_service_info.nlp) {
      services.push(nlp_service)
    }

    return services
  } catch (err) {
    throw new ServiceError("Error while listing services")
  }
}

async function listLlmServices() {
  try {
    const gateway_services = process.env.LLM_GATEWAY_SERVICES

    let host = gateway_services + "/services"
    const llm_service_info = await axios.get(host)

    return llm_service_info
  } catch (err) {
    throw new ServiceError("Error while listing services")
  }
}

module.exports = { listSaasServices, listLlmServices }
