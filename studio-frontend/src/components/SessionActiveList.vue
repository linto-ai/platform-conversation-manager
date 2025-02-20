<template>
  <Loading v-if="loading" />
  <ErrorPage v-else-if="error" :error="error" />
  <div v-else-if="sessionList.length > 0" class="flex flex1 col gap-small">
    <SessionListLine
      v-if="sessionList.length > 0"
      v-for="session in sessionList"
      :key="session.id"
      :session="session"></SessionListLine>
    <!-- todo: pagination -->
  </div>
  <div v-else>
    <h2 class="center-text">
      {{ $t("session.list_page.no_sessions") }}
    </h2>
  </div>
</template>
<script>
import { bus } from "@/main"

import { apiGetStartedSessions } from "@/api/session.js"
import { genericSessionList } from "@/mixins/genericSessionList"
import sortSessionByDate from "@/tools/sortSessionByDate"

import Loading from "@/components/Loading.vue"
import ErrorPage from "@/components/ErrorPage.vue"
import SessionListLine from "@/components/SessionListLine.vue"

export default {
  mixins: [genericSessionList],
  props: {
    currentOrganizationScope: {
      type: String,
      required: true,
    },
  },
  mounted() {},
  methods: {
    async fetchSessions() {
      this.loading = true
      try {
        const sessions = await apiGetStartedSessions(
          this.currentOrganizationScope,
        )
        this.sessionList = sessions.sessions
          .filter((s) => s.name[0] != "@")
          .sort(sortSessionByDate)
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
  components: {
    Loading,
    ErrorPage,
    SessionListLine,
  },
}
</script>
