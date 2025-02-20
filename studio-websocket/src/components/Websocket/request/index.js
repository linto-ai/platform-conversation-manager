import axios from "axios"
import Debug from "debug"

const errorDebug = Debug("Websocket:error:request")
const debug = Debug("Websocket:debug:request:debug")
const info = Debug("Websocket:debug:request:info")
// eslint-disable-next-line no-undef
const BASE_API = process.env.CONVO_API

async function sendRequest(url, params, data, headers, userToken) {
  try {
    let req = null
    if (params.method === "get") {
      req = await axios.get(url, {
        ...params,
        params: data,
        headers: {
          ...headers,
          Authorization: `Bearer ${userToken}`,
        },
      })
    } else {
      req = await axios(url, {
        ...params,
        data,
        headers: {
          ...headers,
          Authorization: `Bearer ${userToken}`,
        },
      })
    }
    if (req.status >= 200 && req.status < 300) {
      info("Request success", url, params, data, headers, userToken)
      debug(req.data)
      return { status: "success", statusCode: req.status, data: req.data }
    } else {
      throw req
    }
  } catch (error) {
    info("Error while sending request", url, params, data, headers, userToken)
    errorDebug(error)
    return { status: "error", statusCode: error.status, data: error }
    //return null
  }
}

// TODO: prefix all functions with "api"

export async function getConversationById(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}?key=text&projection=0`,
    {
      method: "GET",
    },
    null,
    null,
    userToken,
  )
}

export async function getSubtitleListByConversationId(
  conversationId,
  userToken,
) {
  let versionsRes = await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle`,
    {
      method: "GET",
    },
    null,
    null,
    userToken,
  )
  if (versionsRes.status === "error") {
    return versionsRes
  }

  return versionsRes.data || []
}

export async function apiDeleteConversation(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "delete" },
    {},
    null,
    null,
    userToken,
  )
}

export async function apiUpdateConversation(
  conversationId,
  payload,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "patch" },
    payload,
    null,
    userToken,
  )
}

export async function updateUserRightInConversation(
  conversationId,
  userId,
  right,
  userToken,
  headers,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/users/${userId}`,
    { method: "patch" },
    { right },
    headers,
    userToken,
  )
}

export async function apiGetJobs(conversationId, userToken) {
  const res = await sendRequest(
    `${BASE_API}/conversations/${conversationId}?key=jobs`,
    { method: "get" },
    null,
    null,
    userToken,
  )
  if (res.status === "error") return res
  else return res.data.jobs
}

export async function apiGetRights(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}?key=sharedWithUsers,owner`,
    { method: "get" },
    null,
    null,
    userToken,
  )
}

export async function getConversationNameAndDesc(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}?key=name,description`,
    { method: "get" },
    null,
    null,
    userToken,
  )
}

export async function apiGetConversationText(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}?key=text`,
    { method: "get" },
    null,
    null,
    userToken,
  )
}

export async function apiGetConversationSpeakers(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}?key=speakers`,
    { method: "get" },
    null,
    null,
    userToken,
  )
}

export async function apiGetKeywords(conversationId, orgaId, userToken) {
  // get tags ids
  const tagsIdsRequest = await sendRequest(
    `${BASE_API}/conversations/${conversationId}?key=tags`,
    { method: "get" },
    null,
    null,
    userToken,
  )

  let tagsIds = []
  if (tagsIdsRequest.status === "error") {
    return tagsIdsRequest
  } else {
    tagsIds = tagsIdsRequest.data.tags
  }
  // get tags
  const categoriesWithTags = await apiSearchTagsById(
    conversationId,
    tagsIds,
    userToken,
  )

  if (categoriesWithTags.status === "error") return []

  return categoriesWithTags?.filter((cat) => cat.name === "keyword") ?? []
}

export async function apiSearchTagsById(conversationId, tagsIds, userToken) {
  if (!tagsIds || tagsIds.length === 0) return []

  // name is possible but not used
  const requestRes = await sendRequest(
    `${BASE_API}/conversations/${conversationId}/categories/search`,
    { method: "get" },
    {
      type: "info",
      tags: tagsIds.toString(),
    },
    null,
    userToken,
  )
  if (requestRes.status === "success") {
    return requestRes?.data
  } else {
    return requestRes
  }
}

export async function apiGenerateKeywords(conversationId, userToken) {
  const res = await sendRequest(
    `${BASE_API}/nlp/conversations/${conversationId}/keywords`,
    { method: "post" },
    {
      serviceName: "nlp-keyword-extraction",
      endpoint: "nlp-keyword-extraction",
    },
    null,
    userToken,
  )
  return res
}

export async function generateSubtitlesByConversationId(
  conversationId,
  data,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle`,
    { method: "post" },
    data,
    null,
    userToken,
  )
}

export async function copySubtitlesBySubtitleId(
  conversationId,
  subtitleId,
  data,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}/copy`,
    { method: "post" },
    data,
    null,
    userToken,
  )
}

export async function getSubtitleById(conversationId, subtitleId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}`,
    { method: "get" },
    null,
    null,
    userToken,
  )
}

export async function deleteSubtitlesByIds(
  conversationId,
  subtitleIds,
  userToken,
) {
  let queryParam = subtitleIds.join(",")
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle?subtitleId=${queryParam}`,
    { method: "delete" },
    null,
    null,
    userToken,
  )
}

export async function deleteSubtitlesById(
  conversationId,
  subtitleId,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}`,
    { method: "delete" },
    null,
    null,
    userToken,
  )
}

export async function updateScreen(
  conversationId,
  subtitleId,
  screenId,
  payload,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}/screen/${screenId}`,
    { method: "patch" },
    payload,
    null,
    userToken,
  )
}

export async function addScreen(
  conversationId,
  subtitleId,
  screenId,
  placement,
  payload,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}/screen/${screenId}?placement=${placement}`,
    { method: "post" },
    payload,
    null,
    userToken,
  )
}

export async function deleteScreen(
  conversationId,
  subtitleId,
  screenId,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}/screen/${screenId}`,
    { method: "delete" },
    null,
    null,
    userToken,
  )
}

export async function updateSubtitle(
  conversationId,
  subtitleId,
  payload,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}`,
    { method: "patch" },
    payload,
    null,
    userToken,
  )
}

export async function updateTurn(conversationId, turnId, payload, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/turns/${turnId}`,
    { method: "patch" },
    payload,
    null,
    userToken,
  )
}

export async function apiDeleteTagFromConversation(
  conversationId,
  tagId,
  userToken,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/tags/${tagId}`,
    { method: "delete" },
    {},
    null,
    userToken,
  )
}
