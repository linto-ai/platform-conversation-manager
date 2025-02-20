import { sendRequest } from "../tools/sendRequest"

import { getEnv } from "@/tools/getEnv"

const BASE_API = getEnv("VUE_APP_CONVO_API")

export async function apiGetOrganizationById(organizationId, notif) {
  const getOrganization = await sendRequest(
    `${BASE_API}/organizations/${organizationId}`,
    { method: "get" },
    null,
    notif,
  )
  return getOrganization?.data
}

// export async function getPublicOrganizationById(organizationId, notif) {
//   const getOrganization = await sendRequest(
//     `${BASE_API}/organizations/${organizationId}/public`,
//     { method: "get" },
//     null,
//     notif
//   )
//   return getOrganization?.data
// }

export async function apiGetUserOrganizations(notif) {
  const getUserOrganizations = await sendRequest(
    `${BASE_API}/organizations`,
    { method: "get" },
    null,
    notif,
  )
  return getUserOrganizations?.data
}

export async function apiUpdateOrganisation(
  organizationId,
  organizationObject,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/organizations/${organizationId}`,
    { method: "patch" },
    organizationObject,
    notif,
  )
}

export async function apiAdminUpdateOrganisation(
  organizationId,
  organizationObject,
  notif,
) {
  return await sendRequest(
    `${BASE_API}/administration/organizations/${organizationId}`,
    { method: "patch" },
    organizationObject,
    notif,
  )
}

export async function apiLeaveOrganisation(organizationId, notif) {
  return await sendRequest(
    `${BASE_API}/organizations/${organizationId}/self`,
    { method: "delete" },
    {},
    notif,
  )
}

export async function apiDeleteOrganisation(organizationId, notif) {
  return await sendRequest(
    `${BASE_API}/organizations/${organizationId}`,
    { method: "delete" },
    {},
    notif,
  )
}

export async function apiCreateOrganisation(payload, notif) {
  return await sendRequest(
    `${BASE_API}/organizations`,
    { method: "post" },
    payload,
    notif,
  )
}

export async function apiInviteUsersMachingEmail(organizationId, notif) {
  return await sendRequest(
    `${BASE_API}/administration/organizations/${organizationId}/inviteMatchingMail`,
    { method: "post" },
    {},
    notif,
  )
}
