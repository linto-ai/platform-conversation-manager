import conversationsPerPage from "../const/conversationsPerPage"
import { sendMultipartFormData } from "../tools/sendMultipartFormData"
import { sendRequest } from "../tools/sendRequest"

import { getEnv } from "@/tools/getEnv"

const BASE_API = getEnv("VUE_APP_CONVO_API")

const DEFAULT_PAGE_SIZE = conversationsPerPage

//  -- -- -- conversations listing -- -- -- --
//
// TODO: Could be refactored to use the same base function for pagination (with functional programming)

export async function apiGetConversationsSharedWith(
  tag,
  text,
  title,
  page,
  {
    pageSize = DEFAULT_PAGE_SIZE,
    sortField = "last_update",
    sortOrder = -1,
  } = {},

  notif,
) {
  tag = tag || []
  const getConversations = await sendRequest(
    `${BASE_API}/conversations/shared`,
    { method: "get" },
    {
      tags: tag.toString(),
      text,
      name: title,
      page,
      size: pageSize,
      sortField,
      sortCriteria: sortOrder,
    },
    notif,
  )

  if (getConversations.status == "error") {
    throw getConversations.error
  }

  return getConversations.data
}

export async function apiGetConversationsByOrganization(
  organizationScope,
  page,
  {
    pageSize = DEFAULT_PAGE_SIZE,
    sortField = "last_update",
    sortOrder = -1,
  } = {},
  notif,
) {
  const getConversations = await sendRequest(
    `${BASE_API}/organizations/${organizationScope}/conversations`,
    { method: "get" },
    { page, size: pageSize, sortField, sortCriteria: sortOrder },
    notif,
  )

  if (getConversations.status == "error") {
    throw getConversations.error
  }

  return getConversations.data
}

export async function apiGetConversationsWithoutTagsByOrganization(
  organizationScope,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  sortField = "created",
  sortOrder = -1,
  notif,
) {
  const getConversations = await sendRequest(
    `${BASE_API}/organizations/${organizationScope}/conversations?filter=notags`,
    { method: "get" },
    { page, size: pageSize, sortField, sortCriteria: sortOrder },
    notif,
  )

  if (getConversations.status == "error") {
    throw getConversations.error
  }
  return getConversations.data
}

export async function apiGetConversationsByTags(
  organizationScope,
  tag,
  text,
  title,
  page,
  { pageSize = DEFAULT_PAGE_SIZE, sortField = "created", sortOrder = -1 } = {},
  notif,
) {
  const getConversations = await sendRequest(
    `${BASE_API}/organizations/${organizationScope}/conversations`,
    { method: "get" },
    {
      tags: tag.toString(),
      text,
      name: title,
      page,
      size: pageSize,
      sortField,
      sortCriteria: sortOrder,
    },
    notif,
  )
  if (getConversations.status == "error") {
    console.error(getConversations.error)
    throw getConversations.error
  }
  return getConversations.data
}

export async function apiGetFavoritesConversations(
  tag,
  text,
  title,
  page,
  {
    pageSize = DEFAULT_PAGE_SIZE,
    sortField = "last_update",
    sortOrder = -1,
  } = {},
  notif,
) {
  tag = tag || []

  const res = await sendRequest(
    `${BASE_API}/users/self/favorites`,
    { method: "get" },
    {
      tags: tag.toString(),
      text,
      name: title,
      page,
      size: pageSize,
      sortField,
      sortCriteria: sortOrder,
    },
    notif,
  )

  if (res.status == "error") {
    console.error(res.error)
    throw res.error
  }
  return res.data
}

// -- -- -- conversations details -- -- -- --

export async function apiCreateConversation(
  organizationId,
  {
    name,
    description,
    membersRight,
    serviceName,
    transcriptionConfig,
    segmentCharSize,
    lang,
    endpoint,
    tracks,
    url, // tracks or url is required
  },
  notif,
  onUploadProgress = null,
) {
  try {
    let formData = new FormData()

    formData.append("organizationId", organizationId)
    formData.append("name", name)
    formData.append("description", description)
    formData.append("membersRight", membersRight)
    formData.append("serviceName", serviceName)
    formData.append("transcriptionConfig", transcriptionConfig)
    formData.append("segmentCharSize", segmentCharSize)
    formData.append("lang", lang)
    formData.append("endpoint", endpoint)

    if (tracks) {
      for (let i = 0; i < tracks.length; i++) {
        formData.append("file", tracks[i])
      }
    } else {
      formData.append("url", url)
    }

    let req = await sendMultipartFormData(
      `${BASE_API}/organizations/${organizationId}/conversations/create`,
      "post",
      formData,
      notif,
      onUploadProgress,
    )

    return req.status == "success"
  } catch (e) {
    console.error(e)
    return false
  }
}

export async function apiCountConversation(organizationScope, tag = [], notif) {
  const getConversations = await apiGetConversationsByTags(
    organizationScope,
    tag,
    null,
    null,
    1,
    { pageSize: 1 },
  )
  return getConversations?.count || 0
}

export async function apiGetConversationById(
  conversationId,
  projection = {},
  notif,
) {
  const getConversation = await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "get" },
    { projection },
    notif,
  )
  return getConversation?.data
}

export async function apiGetConversationLastUpdate(conversationId, notif) {
  const getConversation = await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "get" },
    { key: ["last_update"].toString() },
    notif,
  )
  return getConversation?.data
}

export async function apiDeleteConversation(conversationId, notif) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "delete" },
    {},
    notif,
  )
}

export async function apiDeleteMultipleConversation(
  organizationId,
  conversationsIds,
  notif,
) {
  const conversationsIdsString = conversationsIds.join(",")

  const requestRes = await sendRequest(
    `${BASE_API}/organizations/${organizationId}/conversations`,
    { method: "delete" },
    { conversationsId: conversationsIdsString },
    notif,
  )

  return requestRes
}

export async function apiGetAudioFileFromConversation(conversationId, notif) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/media`,
    {
      method: "get",
      responseType: "blob",
    },
    {},
    notif,
    {},
  )
}

export async function apiGetAudioWaveFormFromConversation(
  conversationId,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/media?mediatype=json`,
    {
      method: "get",
      responseType: "json",
    },
    {},
    notif,
    {},
  )
}

export async function apiUpdateConversation(conversationId, payload, notif) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "patch" },
    payload,
    notif,
  )
}

export async function apiGetJsonFileFromConversation(
  conversationId,
  speakers,
  keywords,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/download?format=json`,
    { method: "post" },
    {
      filter: { speaker: speakers.join(","), keyword: keywords.join(",") },
      metadata: {
        description: true,
        tags: true,
        keyword: true,
        timestamp: true,
        speakers: true,
      },
    },
    notif,
  )
}

export async function apiGetTextFileFromConversation(
  conversationId,
  speakers,
  keywords,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/download?format=text`,
    { method: "post" },
    {
      filter: { speaker: speakers.join(","), keyword: keywords.join(",") },
      metadata: {
        description: true,
        tags: true,
        keyword: true,
        timestamp: true,
        speakers: true,
      },
    },
    notif,
  )
}

export async function apiGetDocxFileFromConversation(
  conversationId,
  { speakers = [], keywords = [], preview = false } = {},
  notif,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/download?format=docx&preview=${preview}`,
    { method: "post", responseType: "blob" },
    {
      filter: { speaker: speakers.join(","), keyword: keywords.join(",") },
      metadata: {
        description: true,
        tags: true,
        keyword: true,
        timestamp: true,
        speakers: true,
      },
    },
    notif,
  )
}

export async function apiGetGenericFileFromConversation(
  conversationId,
  format,
  service,
  {
    speakers = [],
    keywords = [],
    preview = false,
    regenerate = false,
    title = "",
  } = {},
  notif,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/download?format=${format}&preview=${preview}&flavor=${service}&regenerate=${regenerate}&title=${title}`,
    { method: "post", responseType: "blob" },
    {
      filter: { speaker: speakers.join(","), keyword: keywords.join(",") },
      metadata: {
        description: true,
        tags: true,
        keyword: true,
        timestamp: true,
        speakers: true,
      },
    },
    notif,
  )
}

export async function apiGetStatusExport(conversationId, notif) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/export/list`,
    { method: "get" },
    {},
    notif,
  )
}

export async function apiGetFileFromConversationSubtitle(
  conversationId,
  subtitleId,
  type,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/subtitle/${subtitleId}?type=${type}`,
    { method: "get" },
  )
}

export async function apiSearchConversationByText(payload, notif) {
  const res = await sendRequest(
    `${BASE_API}/conversations/search`,
    { method: "post" },
    {
      text: payload.text,
      organizationId: payload.organizationId,
      searchType: ["title", "description", "text"],
    },
    null,
  )
  return { conversations: res?.data?.conversations }
}

export async function apiStartKeywordExtrator(conversationId, method, notif) {
  const res = await sendRequest(
    `${BASE_API}/nlp/${conversationId}/keyword`,
    { method: "post" },
    { method: method },
    notif,
  )
  return res
}

export async function apiGetUserRightFromConversation(conversationId, notif) {
  const res = await sendRequest(
    `${BASE_API}/conversations/${conversationId}/rights`,
    { method: "get" },
    {},
    notif,
  )
  return res.data
}

export async function apiGetUsersFromMultipleConversation(
  conversationsId,
  notif,
) {
  const res = await sendRequest(
    `${BASE_API}/conversations/users`,
    { method: "post" },
    { conversations: conversationsId.join(",") },
    notif,
  )
  return res.data
}

export async function apiInviteInConversation(conversationId, email, notif) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/invite`,
    { method: "post" },
    { email, right: 1 },
    notif,
  )
}

export async function apiAddConversationToFavorites(conversationId, notif) {
  return await sendRequest(
    `${BASE_API}/users/self/favorites/${conversationId}`,
    { method: "put" },
    {},
    notif,
  )
}

export async function apiRemoveConversationFromFavorites(
  conversationId,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/users/self/favorites/${conversationId}`,
    { method: "delete" },
    {},
    notif,
  )
}

export async function apiAddTagToConversation(
  conversationId,
  tagId,
  notif = null,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/tags/${tagId}`,
    { method: "post" },
    {},
    notif,
  )
}

export async function apiDeleteTagFromConversation(
  conversationId,
  tagId,
  notif = null,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/tags/${tagId}`,
    { method: "delete" },
    {},
    notif,
  )
}

export async function apiGetConversationChild(conversationId, fields, notif) {
  let res = await sendRequest(
    `${BASE_API}/conversations/${conversationId}/child`,
    { method: "get" },
    { projection: fields ? fields.toString() : "" },
    notif,
  )

  if (res.status == "error") {
    console.error(res.error)
    return []
  }

  return res?.data ?? []
}
