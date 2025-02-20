import { sendRequest } from "../tools/sendRequest"
import { sendMultipartFormData } from "../tools/sendMultipartFormData"

import { getEnv } from "@/tools/getEnv"

const BASE_API = getEnv("VUE_APP_CONVO_API")
const BASE_AUTH = getEnv("VUE_APP_CONVO_AUTH")

export async function apiGetUsers() {
  const res = await sendRequest(`${BASE_API}/users`, { method: "get" })

  return res?.data || []
}

export async function apiGetPersonalUserInfo() {
  const getUserInfos = await sendRequest(`${BASE_API}/users/self`, {
    method: "get",
  })

  return getUserInfos
}

export async function apiGetPublicUserById(userId) {
  const getUserInfos = await sendRequest(`${BASE_API}/users/${userId}`, {
    method: "get",
  })

  return getUserInfos
}

export async function apiGetUsersByConversationId(conversationId, notif) {
  const res = await sendRequest(
    `${BASE_API}/conversations/${conversationId}/users`,
    { method: "get" },
    null,
    notif,
  )

  return res?.data?.conversationUsers
}

export async function apiUpdateUserRightInConversation(
  conversationId,
  userId,
  right,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/users/${userId}`,
    { method: "patch" },
    { right: right },
    notif,
  )
}

export async function apiUpdateMultipleUsersInMultipleConversations(
  conversationsIds,
  users,
  organizationId,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/conversations/shared/access`,
    { method: "post" },
    {
      conversations: conversationsIds.join(","),
      users: JSON.stringify({ users }),
      organizationId,
    },
    notif,
  )
}

export async function apiRemoveUserFromOrganisation(
  organizationId,
  userId,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/organizations/${organizationId}/users`,
    { method: "delete" },
    { userId },
    notif,
  )
}

export async function apiLoginUser(email, password) {
  return await sendRequest(
    `${BASE_AUTH}/login`,
    { method: "post" },
    {
      email,
      password,
    },
    {},
  )
}

export async function apiLoginUserMagicLink(magicId) {
  return await sendRequest(
    `${BASE_AUTH}/login/magic-link`,
    { method: "post" },
    {
      psw: "psw", // Needed
      magicId,
    },
    {},
  )
}

export async function apiAddUserToOrganisation(
  organizationId,
  email,
  role = 1,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/organizations/${organizationId}/users`,
    { method: "post" },
    {
      email,
      role,
    },
    notif,
  )
}

export async function apiUpdateUserRoleInOrganisation(
  organizationId,
  userId,
  role,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/organizations/${organizationId}/users`,
    { method: "patch" },
    {
      role,
      userId,
    },
    notif,
  )
}

export async function apiSearchUser(search, signal, notif) {
  return await sendRequest(
    `${BASE_API}/users/search`,
    { method: "get", signal },
    { search },
    notif,
  )
}

export async function apiUpdateUserInfo(payload, notif) {
  return await sendRequest(
    `${BASE_API}/users/self`,
    { method: "put" },
    payload,
    notif,
  )
}

export async function apiRecoverPassword(email, notif) {
  return await sendRequest(
    `${BASE_API}/users/self/reset-password`,
    { method: "post" },
    { email },
    notif,
  )
}

export async function apiCreateUser(payload, notif) {
  return await sendMultipartFormData(
    `${BASE_API}/users`,
    "post",
    payload,
    notif,
  )
}

export async function apiSendVerificationLink(notif) {
  return await sendMultipartFormData(
    `${BASE_API}/users/self/verify-email`,
    "patch",
    {},
    notif,
  )
}

export async function getLoginMethods() {
  const req = await sendRequest(`${BASE_AUTH}/list`, {
    method: "get",
  })

  return req.data || []
}

export async function getOidcToken() {
  return await sendRequest(
    `${BASE_AUTH}/oidc/token`,
    {
      method: "get",
    },
    {},
    false,
    {},
    true,
  )
}
