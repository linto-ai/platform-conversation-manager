import { getEnv } from "../getEnv"

export function testVisioUrl(field, t) {
  const acceptedUrlsStrings = getEnv("VUE_APP_ACCEPTED_JITSI_URLS")

  let acceptedUrls = []
  if (acceptedUrlsStrings) {
    acceptedUrls = acceptedUrlsStrings.split(",")
  }

  field.error = null
  field.valid = false
  field.value = field.value.toLowerCase().trim()

  if (field.value === "") {
    field.error = t("error.required")
    return false
  }

  if (acceptedUrls.length === 0) {
    field.valid = true
    return field.valid
  }

  if (acceptedUrls.some((url) => field.value.includes(url))) {
    field.valid = true
    return field.valid
  }

  field.error = t("error.invalidVisioUrl")

  return field.valid
}
