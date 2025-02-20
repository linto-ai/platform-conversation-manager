import axios from "axios"
import { bus } from "../main.js"
import { getCookie } from "./getCookie"

export async function sendRequest(
  url,
  params,
  data,
  notif,
  headers,
  withoutToken = false,
) {
  // TODO: try to use $route singleton to check $route.meta.backoffice instead
  const isBackOfficePage = location.pathname.startsWith("/backoffice")
  const defaultQueryParams = {}
  if (isBackOfficePage) {
    defaultQueryParams["userScope"] = "backoffice"
  }

  // Get authorization token
  const userToken = getCookie("authToken")
  try {
    let req = null
    if (params.method === "get") {
      if (withoutToken) {
        req = await axios.get(url, {
          ...params,
          params: {
            ...data,
            ...defaultQueryParams,
            t: Date.now(),
          },
        })
      } else {
        req = await axios.get(url, {
          ...params,
          params: {
            ...data,
            ...defaultQueryParams,
            t: Date.now(),
          },
          headers: {
            ...headers,
            Authorization: withoutToken ? null : `Bearer ${userToken}`,
          },
        })
      }
    } else {
      req = await axios(url, {
        ...params,
        data,
        params: {
          ...defaultQueryParams,
        },
        headers: {
          ...headers,
          Authorization: withoutToken ? null : `Bearer ${userToken}`,
        },
      })
    }

    if (req.status >= 200 && req.status < 300) {
      let msg = req.data?.message || req.data?.msg
      if (notif) {
        bus.$emit("app_notif", {
          status: "success",
          message: notif.message || msg,
          timeout: notif.timeout,
          redirect: notif.redirect,
        })
      }
      return { status: "success", data: req.data }
    } else {
      throw req
    }
  } catch (error) {
    if (error.code === "ERR_CANCELED") return
    let errMsg = error?.response?.data?.message || error.code || error.message
    if (notif) {
      bus.$emit("app_notif", {
        status: "error",
        message: errMsg,
        timeout: null,
        redirect: false,
      })
    }
    return { status: "error", error, message: errMsg }
  }
}
