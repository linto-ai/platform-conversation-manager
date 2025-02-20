import Vue from "vue"
import App from "./App.vue"
import router from "./routers/app-router.js"
import store from "./store.js"
import i18n from "./i18n"
import Debug from "debug"
import vClickOutside from "v-click-outside"
import Fragment from "vue-fragment"
//import { setDefaultEnv } from "./tools/setDefaultEnv.js"
import SessionWS from "@/models/SessionWS.js"
import "./filters/index.js"

//setDefaultEnv() // doesn't work

export const bus = new Vue()
Vue.use(vClickOutside)
Vue.use(Fragment.Plugin)

Vue.config.productionTip = false
Vue.prototype.debug = Debug("Vue")
Vue.prototype.$sessionWS = new SessionWS()

Debug.enable(process.env.VUE_APP_DEBUG)

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
}).$mount("#app")
