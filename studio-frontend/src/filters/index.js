import Vue from "vue"
import store from "../store.js"
import moment from "moment"
import { getCookie } from "../tools/getCookie"
import { sendRequest } from "../tools/sendRequest"
import { logout } from "../tools/logout"
import { sendMultipartFormData } from "../tools/sendMultipartFormData.js"
import { setCookie } from "../tools/setCookie.js"
import { timeToHMS } from "../tools/timeToHMS.js"
import { capitalizeFirstLetter } from "../tools/capitalizeFirstLetter.js"
import { testFieldEmpty } from "../tools/fields/testEmpty.js"
import { testContent } from "../tools/fields/testContent.js"
import { testName } from "../tools/fields/testName.js"
import { testEmail } from "../tools/fields/testEmail.js"
import { testPassword } from "../tools/fields/testPassword.js"
// Send request

Vue.filter("sendRequest", sendRequest)

Vue.filter("logout", logout)

// Send request multipart formData
Vue.filter("sendMultipartFormData", sendMultipartFormData)

// Convert time: seconds > hh:mm:ss
Vue.filter("timeToHMS", timeToHMS)

// Convert: date > JJ/MM/YYYY
Vue.filter("dateToJMY", function (date) {
  let splitDate = date.split("T")
  return splitDate[0]
})

// Convert: date > JJ/MM/YYYY - hh:mm:ss
Vue.filter("dateToJMYHMS", function (date) {
  let splitDate = date.split("T")
  let fullTime = splitDate[1]
  let splitTime = fullTime.split("+")
  return `${splitDate[0]} - ${splitTime[0]}`
})

Vue.filter("CapitalizeFirstLetter", function (string) {
  return capitalizeFirstLetter(string)
})

// DISPATCH STORE
Vue.filter("dispatchStore", async function (label, options) {
  try {
    const req = await store.dispatch(label, options)
    if (req?.error) {
      throw req.error
    }
    if (typeof req !== "undefined") {
      return true
    } else {
      throw "an error has occured"
    }
  } catch (error) {
    console.error(error)
    return false
  }
})

// Test if required filed is empty
Vue.filter("testFieldEmpty", testFieldEmpty)

// Test select field
Vue.filter("testSelectField", function (obj) {
  obj.error = null
  obj.valid = false
  if (typeof obj.value === "undefined") {
    obj.value = ""
  }
  if (obj.value === "" || obj.value.length === 0) {
    obj.error = "This field is required"
  } else {
    obj.valid = true
  }
})

// Test name field
Vue.filter("testName", testName)

// Test content field (title, description, etc.)
Vue.filter("testContent", testContent)

// Test password field
Vue.filter("testPassword", testPassword)

// Test confirmation password field
Vue.filter("testPasswordConfirm", function (obj, password) {
  obj.valid = false
  obj.error = null
  obj.value = obj.value.trim()
  if (obj.value.length === 0) {
    obj.error = "This field is required"
  } else {
    if (obj.value !== password.value) {
      obj.error = "Passwords must be the same"
    } else {
      obj.valid = true
    }
  }
})

// Test email field
Vue.filter("testEmail", testEmail)

// Set cookie
Vue.filter("setCookie", setCookie)

// Get cookie
Vue.filter("getCookie", getCookie)

Vue.filter("getTimeDiffText", function (date) {
  return moment(date).fromNow()
})
