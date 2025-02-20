<template>
  <div class="session-day-line" ref="dayLine">
    <div
      class="flex col session-day-line--header"
      :style="styleHeader"
      ref="header">
      <div class="session-day-line--header--content" @click="gotoDay">
        <h4>{{ dayName }} {{ dateFormated }}</h4>
      </div>
    </div>
    <div class="session-day-line--content" ref="dayCards">
      <SessionCard
        v-for="session of sessions"
        :session="session"
        :key="session.id"></SessionCard>
      <div class="center-text" v-if="sessions.length == 0">
        {{ $t("session.list_page.no_sessions_this_day") }}
      </div>
    </div>
  </div>
</template>
<script>
import SessionCard from "@/components/SessionCard.vue"

export default {
  props: {
    lineIndex: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    sessions: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      styleHeader: {
        //position: "sticky",
        //bottom: `${(this.lineIndex - 1) * 3.8 + 0.25}rem`,
      },
    }
  },
  mounted() {
    const height = this.$refs.header.clientHeight + 4
    this.styleHeader.bottom = `${(this.lineIndex - 1) * height}px`
  },
  computed: {
    dateFormated() {
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }

      return this.date.toLocaleDateString(undefined, options)
    },
    dayName() {
      const options = {
        weekday: "long",
      }

      return this.date.toLocaleDateString(undefined, options)
    },
  },
  methods: {
    gotoDay() {
      // scroll to the day
      const day = this.$refs.dayCards
      day.scrollIntoView({ behavior: "smooth", block: "center" })
    },
  },
  components: { SessionCard },
}
</script>
