<template>
  <MainContent sidebar>
    <Tabs v-model="activeTab" :tabs="tabs"></Tabs>
    <SessionWeekList
      v-if="activeTab == 'timeline'"
      :currentOrganizationScope="currentOrganizationScope"></SessionWeekList>
    <SessionActiveList
      v-else
      :currentOrganizationScope="currentOrganizationScope"></SessionActiveList>
    <!-- <Loading v-if="loading" />
    <ErrorPage v-else-if="error" :error="error" />
    <div v-else class="flex flex1">
      <div v-if="sessionList.length > 0" class="flex col gap-medium flex1">
        <SessionListLine
          v-for="session in sessionList"
          :key="session.id"
          :session="session"></SessionListLine>
        <SessionWeekList></SessionWeekList>
      </div>
      <div class="flex col align-center justify-center flex1" v-else>
        <h2 class="center-text">
          {{ $t("session.list_page.no_sessions") }}
        </h2>
        <router-link
          :title="$t('navigation.conversation.create')"
          to="/interface/conversations/create"
          class="btn green-border">
          <span class="label">{{ $t("navigation.conversation.create") }}</span>
          <span class="icon new"></span>
        </router-link>
      </div>
    </div> -->
  </MainContent>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import {
  apiCountFutureSessions,
  apiCountActiveSessions,
} from "@/api/session.js"

import MainContent from "@/components/MainContent.vue"
import Tabs from "@/components/Tabs.vue"
import Loading from "@/components/Loading.vue"
import ErrorPage from "@/components/ErrorPage.vue"
import SessionListLine from "@/components/SessionListLine.vue"
import SessionWeekList from "@/components/SessionWeekList.vue"
import SessionActiveList from "@/components/SessionActiveList.vue"
export default {
  props: {
    currentOrganizationScope: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      activeTab: "started",

      loading: false,
      error: null,
      countActiveSessions: 0,
      countFutureSessions: 0,
      // startedSessions: [],
      // activeSessions: [],
    }
  },
  mounted() {
    //this.fetchCountActiveSessions()
  },
  methods: {
    async fetchCountActiveSessions() {
      this.loading = true
      try {
        const count = await apiCountActiveSessions(
          this.currentOrganizationScope,
        )
        this.countActiveSessions = count
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
    async fetchCountFutureSessions() {
      this.loading = true
      try {
        const count = await apiCountFutureSessions(
          this.currentOrganizationScope,
        )
        this.countFutureSessions = count
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
    // async fetchFutureSessions() {
    //   this.loading = true
    //   try {
    //     const sessions = await apiGetFutureSessions(
    //       this.currentOrganizationScope,
    //     )
    //     this.startedSessions = sessions.sessions
    //   } catch (e) {
    //     console.error(e)
    //     this.error = e
    //   } finally {
    //     this.loading = false
    //   }
    // },
  },
  watch: {
    activeTab(value) {},
  },
  computed: {
    tabs() {
      return [
        {
          name: "started",
          label: this.$i18n.t("session.list_page.tabs.ongoing_sessions"),
          icon: "record",
          //badge: this.countActiveSessions,
        },
        {
          name: "timeline",
          label: this.$i18n.t("session.list_page.tabs.scheduled_sessions"),
          icon: "clock",
          //badge: this.countFutureSessions,
        },
      ]
    },
  },
  components: {
    Fragment,
    MainContent,
    Tabs,
    Loading,
    ErrorPage,
    SessionListLine,
    SessionWeekList,
    SessionActiveList,
  },
}
</script>
