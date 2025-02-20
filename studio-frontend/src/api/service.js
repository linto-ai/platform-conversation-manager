import nextServices from "../const/nextServices"
import { sendRequest } from "../tools/sendRequest"

import { getEnv } from "@/tools/getEnv"

const BASE_API = getEnv("VUE_APP_CONVO_API")

function getLangCode(lang) {
  const lang_code = {
    en: "en-US",
    fr: "fr-FR",
  }

  if (!lang_code[lang]) {
    throw new Error("Language not supported")
  }

  return lang_code[lang]
}
const lang_code_alias = {
  en: ["en-US", "en-GB", "en-AU", "en-CA", "en-IN", "en-NZ", "en-ZA"],
  fr: ["fr-FR", "fr-CA", "fr-BE", "fr-CH"],
}

export async function apiGetTranscriptionService(lang, signal) {
  const getTranscriptionService = await sendRequest(
    `${BASE_API}/services`,
    { method: "get", signal },
    {},
    null,
  )

  try {
    const res = getTranscriptionService?.data ?? []
    const transcriptionServicesList = res.filter(
      (service) => !service?.desc?.type,
    )

    if (lang && lang !== "*") {
      return transcriptionServicesList.filter(
        (service) => lang_code_alias[lang].indexOf(service.language) !== -1,
      )
    } else {
      return transcriptionServicesList
    }
  } catch (e) {
    return []
  }
}

export async function apiGetNlpService(notif) {
  const getHighlightsService = await sendRequest(
    `${BASE_API}/services`,
    { method: "get" },
    {},
    notif,
  )

  const res = (getHighlightsService?.data ?? [])
    .filter((service) => service.scope.indexOf("nlp") !== -1)
    .concat(nextServices)

  return res
}

export async function getLLMService() {
  const req = await sendRequest(
    `${BASE_API}/services/llm`,
    { method: "get" },
    {},
    null,
  )

  if (req.status === "success") {
    return req.data
  } else {
    return []
  }
}

export async function apiGetMetadataLLMService(conversationId) {
  const req = await sendRequest(
    `${BASE_API}/conversations/${conversationId}/export/list`,
    { method: "get" },
    {},
    null,
  )

  if (req.status === "success") {
    return req.data || []
  } else {
    return []
  }
}
