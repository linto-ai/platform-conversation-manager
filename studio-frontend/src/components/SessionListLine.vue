<template>
  <router-link
    :title="name"
    :to="`/interface/${sessionOrganizationId}/sessions/${id}`"
    class="session-line flex align-center">
    <SessionStatus :session="session" @click="goToSessionSettings" />
    <div class="flex1 session-line__title text-cut">{{ name }}</div>
    <LabeledValueSmall
      v-if="isPending"
      class="session-line__time"
      :label="$t('session.list_page.start_time')"
      :value="startTimeFormatted" />

    <LabeledValueSmall
      v-if="isStarted"
      class="session-line__time"
      :label="$t('session.list_page.end_time')"
      :value="endTimeFormatted" />
  </router-link>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import { sessionModelMixin } from "@/mixins/sessionModel.js"
import SessionStatus from "@/components/SessionStatus.vue"

import LabeledValueSmall from "@/components/LabeledValueSmall.vue"

export default {
  mixins: [sessionModelMixin],
  props: {
    session: { type: Object, required: true },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    goToSessionSettings(e) {
      this.$router.push({
        name: "sessions settings",
        params: {
          organizationId: this.sessionOrganizationId,
          sessionId: this.id,
        },
      })
      e.preventDefault()
      e.stopPropagation()
    },
  },
  components: { Fragment, LabeledValueSmall, SessionStatus },
}
</script>
