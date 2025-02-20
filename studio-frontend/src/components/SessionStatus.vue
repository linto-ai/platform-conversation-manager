<template>
  <div
    @click="onClick"
    class="flex align-center justify-center session-status gap-small"
    :title="text">
    <span class="session-on-air flex align-center gap-small" v-if="isActive">
      <span v-if="!small">[</span>
      <StatusLed on />
      <span v-if="!small">On Air</span>
      <span v-if="!small">]</span>
    </span>

    <span
      class="session-on-air session-on-air--off flex align-center gap-small"
      v-else-if="isStarted">
      <span v-if="!small">[</span>
      <StatusLed off />
      <span v-if="!small">Off Air</span>
      <span v-if="!small">]</span>
    </span>

    <span
      class="session-on-air session-on-air--muted flex align-center gap-small"
      v-else>
      <!-- <span>[</span> -->
      <span class="icon record-off" />
      <!-- <span v-if="!small">Muted</span> -->
      <!-- <span>]</span> -->
    </span>

    <span v-if="withText">{{ text }}</span>
  </div>
</template>
<script>
import { sessionModelMixin } from "@/mixins/sessionModel.js"
import StatusLed from "./StatusLed.vue"

export default {
  mixins: [sessionModelMixin],
  props: {
    session: { type: Object, required: true },
    small: { type: Boolean, default: false },
    withText: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  computed: {
    icon() {
      switch (true) {
        case this.isTerminated:
          return "save-cloud"
        case this.isActive:
          return "record"
        case this.isStarted:
          return "pause"
        default:
          return "clock"
      }
    },
    text() {
      switch (true) {
        case this.isTerminated:
          return this.$t("session.sessions_status.terminated")
        case this.isActive:
          return this.$t("session.sessions_status.active")
        case this.isStarted:
          return this.$t("session.sessions_status.pending")
        default:
          return this.$t("session.sessions_status.scheduled")
      }
    },
    iconClasses() {
      let res = ["icon", this.icon]

      if (this.small) {
        res.push("small")
      }

      return res
    },
  },
  mounted() {},
  methods: {
    onClick(e) {
      this.$emit("click", e)
    },
  },
  components: { StatusLed },
}
</script>
