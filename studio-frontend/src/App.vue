<template>
  <div id="app" v-if="dataLoaded || noOrganization">
    <div id="app-view" class="flex col flex1">
      <!-- HEADER -->
      <keep-alive>
        <router-view
          v-if="isAuthenticated()"
          name="AppHeader"
          :currentOrganizationScope="currentOrganizationScope"
          :noOrganization="noOrganization"
          :userInfo="userInfo"
          :userOrganizations="userOrganizations"
          :currentOrganization="currentOrganization"></router-view>
      </keep-alive>
      <div class="app-view-content flex col flex1" v-if="!error">
        <!-- MAIN VIEW -->
        <!-- <loading-overlay></loading-overlay> -->
        <router-view
          v-if="!noOrganization"
          :userInfo="userInfo"
          :currentOrganizationScope="currentOrganizationScope"
          :userOrganizations="userOrganizations"
          :currentOrgaPersonal="currentOrgaPersonal"
          :currentOrganization="currentOrganization"
          :key="resetKey"></router-view>

        <NoOrganizationComponent v-else />
      </div>
      <ErrorView v-else />

      <router-view name="AppNotif"></router-view>
    </div>
  </div>
  <div v-else>
    <div
      class="flex col flex1 align-center justify-center"
      style="height: 100vh">
      <Loading />
    </div>
  </div>
</template>
<script>
import { bus } from "./main.js"
import { getEnv } from "@/tools/getEnv"

import LoadingOverlay from "@/components/LoadingOverlay.vue"
import ErrorView from "./views/Error.vue"
import ErrorPage from "./components/ErrorPage.vue"
import Loading from "./components/Loading.vue"
import PUBLIC_ROUTES from "./const/publicRoutes.js"
import NoOrganizationComponent from "./views/NoOrganization.vue"
import { getCookie } from "./tools/getCookie"
export default {
  data() {
    return {
      appMounted: false,
      orgasLoaded: false,
      userOrgasLoaded: false,
      currentRoute: {},
      convosLoaded: false,
      error: false,
      resetKey: 1,
      noOrganization: false,
    }
  },
  mounted() {
    const enableSession = getEnv("VUE_APP_ENABLE_SESSION") === "true"

    bus.$on("set_organization_scope", async (data) => {
      this.setOrganizationScope(data.organizationId)
      await this.dispatchUserOrganizations()
    })
    bus.$on("user_settings_update", async () => {
      await this.getuserInfo()
      await this.dispatchUserOrganizations()
    })
    bus.$on("user_orga_update", async () => {
      await this.dispatchUserOrganizations()
    })

    document.documentElement.setAttribute(
      "data-theme",
      localStorage.getItem("currentTheme") || "light",
    )
    this.appMounted = true
    document.title = this.title

    if (enableSession) {
      this.$sessionWS.connect()
    }
  },
  beforeDestroy() {
    bus.$off("set_organization_scope")
    bus.$off("user_settings_update")
    bus.$off("user_orga_update")
  },
  watch: {
    $route(to, from) {
      this.resetKey = this.resetKey * -1
      this.error = false
      this.init()
      bus.$emit("navigation", to)
    },
  },
  computed: {
    title() {
      return getEnv("VUE_APP_NAME")
    },
    isPrivateRoute() {
      return !this.$route?.meta?.public
    },
    isBackOfficeRoute() {
      return this.$route?.meta?.backoffice
    },
    userInfo() {
      return this.$store.state.userInfo
    },
    dataLoaded() {
      if (this.isBackOfficeRoute) {
        return !!this.userInfo && this.appMounted
      }

      if (this.isPrivateRoute || this.isAuthenticated()) {
        return (
          !!this.userInfo &&
          this.appMounted &&
          this.userOrgasLoaded &&
          this.currentOrganizationScope &&
          this.currentOrganization?._id
        )
      }
      return true
    },
    userOrganizations() {
      return this.$store.state.userOrganizations
    },
    currentOrganizationScope() {
      if (this.userOrgasLoaded) {
        try {
          const orgaScopeId = this.$store.getters.getCurrentOrganizationScope()
          return orgaScopeId
        } catch (error) {
          console.error("err: ", error)
          this.noOrganization = true
          return null
        }
      }
      return null
    },
    currentOrganization() {
      if (this.currentOrganizationScope !== null) {
        return this.$store.state.currentOrganization
      }
      return {}
    },
    currentOrgaPersonal() {
      return false
    },
    editorView() {
      return (
        [
          "conversations transcription",
          "conversations overview",
          "conversations publish",
          "conversations subtitle",
        ].indexOf(this.$route.name) > -1
      )
    },
    listView() {
      return ["inbox", "explore"].indexOf(this.$route.name) > -1
    },
  },
  methods: {
    async init() {
      if (this.$route.params?.organizationId) {
        this.setOrganizationScope(this.$route.params.organizationId, false)
      } else if (this.$route.query?.organizationId) {
        this.setOrganizationScope(this.$route.query.organizationId)
      }

      if (this.isAuthenticated()) {
        await this.getuserInfo()
        await this.dispatchUserOrganizations()
      }
    },
    isAuthenticated() {
      return getCookie("authToken") !== null
    },
    async setOrganizationScope(organizationId, redirect = true) {
      this.$options.filters.setCookie("cm_orga_scope", organizationId, 7)
      if (!this.listView && redirect) {
        this.$router.push({ name: "inbox" })
      }
    },
    async getuserInfo() {
      try {
        const req = await this.$store.dispatch("getPersonalInfo")
        if (!req) {
          this.$options.filters.logout()
        }
      } catch (error) {
        console.error("err: ", error)
        return
      }
    },
    async dispatchUserOrganizations() {
      try {
        this.userOrgasLoaded = await this.$options.filters.dispatchStore(
          "getUserOrganizations",
        )
        const orgaScopeId = this.$store.getters.getCurrentOrganizationScope()
        await this.$store.dispatch("getCurrentOrganizationById", orgaScopeId)
      } catch (error) {
        console.error("err: ", error)
        return
      }
    },
  },
  components: {
    LoadingOverlay,
    Loading,
    ErrorView,
    ErrorPage,
    NoOrganizationComponent,
  },
  errorCaptured(error) {
    console.error("errorCaptured: ", error)
    this.error = true
  },
}
</script>
<style lang="scss">
@import "./style/style.scss";
</style>
