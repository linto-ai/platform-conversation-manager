import { sendRequest } from "../tools/sendRequest"

import { getEnv } from "@/tools/getEnv"

const BASE_API = getEnv("VUE_APP_CONVO_API")

export function apiPostMetadata(
  scopeId,
  tagId,
  metadataSchema,
  metadataValue,
  notif
) {
  return sendRequest(
    `${BASE_API}/conversations/${scopeId}/tags/${tagId}/metadata`,
    { method: "post" },
    { schema: metadataSchema, value: metadataValue },
    notif
  )
}

export function apiUpdateMetadata(
  scopeId,
  tagId,
  metadataId,
  metadataValue,
  notif
) {
  return sendRequest(
    `${BASE_API}/conversations/${scopeId}/tags/${tagId}/metadata/${metadataId}`,
    { method: "patch" },
    { value: metadataValue },
    notif
  )
}
