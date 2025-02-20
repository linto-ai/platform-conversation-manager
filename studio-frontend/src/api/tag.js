import { sendRequest } from "../tools/sendRequest"
import COLORS from "../const/colors"

import { getEnv } from "@/tools/getEnv"

const BASE_API = getEnv("VUE_APP_CONVO_API")

// -- -- Categories -- -- //

export async function apiCreateCategory(
  scopeId,
  name,
  type,
  scope = "organization",
  notif,
  color = null
) {
  if (!color) color = COLORS[Math.floor(Math.random() * COLORS.length)]

  let requestRes
  if (scope === "organization") {
    requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/categories`,
      { method: "post" },
      {
        name,
        color,
        type,
      },
      notif
    )
  } else {
    requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/categories`,
      { method: "post" },
      {
        name,
        color,
        type,
      },
      notif
    )
  }

  if (requestRes.status == "error") return requestRes

  return requestRes.data
}

export async function apiGetAllCategories(
  scopeId,
  type = "conversation_metadata",
  scope = "organization",
  expand = false,
  possess = false,
  notif = null
) {
  if (scope === "organization") {
    const requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/categories`,
      { method: "get" },
      {
        type,
        expand,
        possess,
      },
      notif
    )
    return requestRes?.data || []
  } else if (scope === "conversation") {
    const requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/categories`,
      { method: "get" },
      {
        type,
        expand,
        possess,
      },
      notif
    )
    return requestRes?.data || []
  }
}

export async function apiGetCategoryById(
  scopeId,
  categoryId,
  scope = "organization",
  { metadata = false, possess = false },
  notif
) {
  if (scope === "organization") {
    const requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/categories/${categoryId}`,
      { method: "get" },
      {},
      notif
    )

    return requestRes?.data || {}
  } else if (scope === "conversation") {
    const requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/categories/${categoryId}`,
      { method: "get" },
      {
        metadata,
        possess,
      },
      notif
    )

    return requestRes?.data || {}
  }
}

export async function apiUpdateCategory(orgaId, categoryId, payload, notif) {
  const requestRes = await sendRequest(
    `${BASE_API}/organizations/${orgaId}/categories/${categoryId}`,
    { method: "patch" },
    payload,
    notif
  )
  return requestRes
}

export async function apiDeleteCategory(orgaId, categoryId, notif) {
  const requestRes = await sendRequest(
    `${BASE_API}/organizations/${orgaId}/categories/${categoryId}`,
    { method: "delete" },
    {},
    notif
  )
  return requestRes
}

export async function apiGetTagsById(orgaId, tagId, notif) {
  const requestRes = await sendRequest(
    `${BASE_API}/organizations/${orgaId}/tags/${tagId}`,
    { method: "get" },
    {},
    notif
  )

  return requestRes?.data || {}
}

export async function apiGetTagsFromCategory(
  scopeId,
  categoryId,
  { linkedTags = [], possess = false },
  scope = "organization",
  notif
) {
  if (scope === "organization") {
    const requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/tags/search`,
      { method: "get" },
      {
        categoryId,
        tags: linkedTags.toString(),
        possess,
      },
      notif
    )
    return requestRes?.data || []
  } else {
    const requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/tags/search`,
      { method: "get" },
      {
        categoryId,
        tags: linkedTags.toString(),
        possess,
      },
      notif
    )
    return requestRes?.data || []
  }
}

export async function apiSearchCategories(
  scopeId,
  name,
  categoryType,
  { scope = "organization" } = {},
  signal,
  notif
) {
  if (scope === "organization") {
    const requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/categories/search`,
      { method: "get", signal },
      {
        type: "category",
        name,
        categoryType,
      },
      notif
    )
    return requestRes?.data || []
  } else {
    const requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/categories/search`,
      { method: "get", signal },
      {
        name,
        type: "category",
        categoryType,
        expand: "true",
      },
      notif
    )
    return requestRes?.data || []
  }
}

export async function apiCategoriesTree(
  orgaId,
  tagsIds,
  categoriesIds,
  categoryType,
  signal,
  notif
) {
  let requestRes
  if (!tagsIds || tagsIds.length === 0) {
    requestRes = await sendRequest(
      `${BASE_API}/organizations/${orgaId}/categories/search`,
      { method: "get", signal },
      {
        type: "explore",
        categoryType,
      },
      notif
    )
  } else {
    requestRes = await sendRequest(
      `${BASE_API}/organizations/${orgaId}/categories/search`,
      { method: "get", signal },
      {
        type: "explore",
        tags: tagsIds.toString(),
        categoryType,
      },
      notif
    )
  }

  return requestRes?.data || []
}

export async function apiGetSharedCategoriesTree(tagsIds, signal, notif) {
  tagsIds = tagsIds || []

  const requestRes = await sendRequest(
    `${BASE_API}/conversations/shared/tags`,
    { method: "get", signal },
    {
      tags: tagsIds.toString() || null,
    },
    notif
  )
  return requestRes?.data || []
}

export async function apiGetfavoritesCategoriesTree(tagsIds, signal, notif) {
  tagsIds = tagsIds || []

  const requestRes = await sendRequest(
    `${BASE_API}/users/self/favorites/tags`,
    { method: "get", signal },
    {
      tags: tagsIds.toString(),
    },
    notif
  )
  return requestRes?.data || []
}

// -- -- Tags -- -- //

export async function apiCreateTag(
  scopeId,
  name,
  categoryId,
  scope = "organization",
  notif
) {
  if (scope === "organization") {
    const requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/tags`,
      { method: "post" },
      {
        name,
        categoryId,
      },
      notif
    )

    if (requestRes.status == "error") return requestRes

    return requestRes.data
  } else {
    const requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/tags`,
      { method: "post" },
      {
        name,
        categoryId,
      },
      notif
    )

    if (requestRes.status == "error") return requestRes

    return requestRes.data
  }
}

export async function apiUpdateTag(orgaId, tagId, payload, notif) {
  const requestRes = await sendRequest(
    `${BASE_API}/organizations/${orgaId}/tags/${tagId}`,
    { method: "patch" },
    payload,
    notif
  )
  return requestRes
}

export async function apiDeleteTag(orgaId, tagId, notif) {
  const requestRes = await sendRequest(
    `${BASE_API}/organizations/${orgaId}/tags/${tagId}`,
    { method: "delete" },
    {},
    notif
  )
  return requestRes
}

// export async function apiGetTag(orgaId, categoryId, notif) {
//   const requestRes = await sendRequest(
//     `${BASE_API}/organizations/${orgaId}/tag/category/${categoryId}`,
//     { method: "get" },
//     {},
//     notif
//   )
//   return requestRes
// }

export async function apiSearchTags(
  scopeId,
  name,
  categoryType,

  { scope = "organization", possess = false },
  signal,
  notif
) {
  if (scope === "organization") {
    const requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/categories/search`,
      { method: "get", signal },
      {
        type: "explore",
        expand: "true",
        name,
        categoryType,
      },
      notif
    )
    return requestRes?.data || []
  } else {
    const requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/tags`,
      { method: "get", signal },
      {
        expand: "true",
        name,
        categoryType,
        possess,
      },
      notif
    )
    return requestRes?.data || []
  }
}

export async function apiSearchTagsById(
  scopeId,
  tagsIds,
  scope = "organization",
  signal,
  notif
) {
  if (!tagsIds || tagsIds.length === 0) return []

  if (scope === "organization") {
    const requestRes = await sendRequest(
      `${BASE_API}/organizations/${scopeId}/categories/search`,
      { method: "get", signal },
      {
        type: "info",
        tags: tagsIds.toString(),
      },
      notif
    )
    return requestRes?.data || []
  } else {
    const requestRes = await sendRequest(
      `${BASE_API}/conversations/${scopeId}/categories/search`,
      { method: "get", signal },
      {
        type: "info",
        tags: tagsIds.toString(),
      },
      notif
    )
    return requestRes?.data || []
  }
}
