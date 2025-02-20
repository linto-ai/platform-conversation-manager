import { sendRequest } from "./sendRequest.js"

export async function sendMultipartFormData(
  url,
  method,
  data,
  notif,
  onUploadProgress = null
) {
  return sendRequest(url, { method, onUploadProgress }, data, notif, {
    charset: "utf-8",
    "Content-Type": "multipart/form-data",
  })
}
