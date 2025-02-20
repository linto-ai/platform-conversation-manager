<template>
  <router-link
    :title="name"
    :to="`/interface/${sessionOrganizationId}/sessions/${id}`"
    class="session-card">
    <div class="session-card--name flex align-center">
      <SessionStatus :session="session" small />
      <span class="flex1">{{ name }}</span>
    </div>
    <div class="session-card--date">
      {{ startTimeFormatted }} – {{ endTimeFormatted }}
    </div>
    <div class="session-card--room">{{ room }}</div>
  </router-link>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import { sessionModelMixin } from "@/mixins/sessionModel.js"
import SessionStatus from "@/components/SessionStatus.vue"

export default {
  mixins: [sessionModelMixin],
  props: {
    session: { type: Object, required: true },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: { Fragment, SessionStatus },
}
</script>
