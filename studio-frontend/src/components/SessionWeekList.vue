<template>
  <Loading v-if="loading" />
  <div class="session-week-list flex col gap-medium" v-else>
    <WeekSelector v-model="startDate"></WeekSelector>
    <div class="flex col gap-medium session-day-list">
      <SessionDayLine
        :lineIndex="7"
        :date="mondayDate"
        :sessions="mondaySessions"></SessionDayLine>
      <SessionDayLine
        :lineIndex="6"
        :date="tuesdayDate"
        :sessions="tuesdaySessions"></SessionDayLine>
      <SessionDayLine
        :lineIndex="5"
        :date="wednesdayDate"
        :sessions="wednesdaySessions"></SessionDayLine>
      <SessionDayLine
        :lineIndex="4"
        :date="thursdayDate"
        :sessions="thursdaySessions"></SessionDayLine>
      <SessionDayLine
        :lineIndex="3"
        :date="fridayDate"
        :sessions="fridaySessions"></SessionDayLine>
      <SessionDayLine
        :lineIndex="2"
        :date="saturdayDate"
        :sessions="saturdaySessions"></SessionDayLine>
      <SessionDayLine
        :lineIndex="1"
        :date="sundayDate"
        :sessions="sundaySessions"></SessionDayLine>
    </div>
  </div>
</template>
<script>
import getStartOfWeek from "../tools/getStartOfWeek"
import { apiGetSessionsBetweenDates } from "@/api/session.js"

import WeekSelector from "@/components/WeekSelector.vue"
import SessionDayLine from "@/components/SessionDayLine.vue"
import Loading from "@/components/Loading.vue"
import { genericSessionList } from "../mixins/genericSessionList"

export default {
  mixins: [genericSessionList],
  props: {
    currentOrganizationScope: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      startDate: getStartOfWeek(new Date()),
    }
  },
  mounted() {},
  methods: {
    async fetchSessions() {
      this.loading = true
      try {
        const response = await apiGetSessionsBetweenDates(
          this.currentOrganizationScope,
          this.mondayDate,
          this.sundayDate,
        )

        console.log(response)
        this.sessionList = response.sessions.filter((s) => s.name[0] != "@")
        this.loading = false
      } catch (error) {
        this.error = error
        this.loading = false
      }
    },
    filterSessionsByDay(day) {
      console.log(this.sessionList)
      return this.sessionList
        .filter((session) => new Date(session.scheduleOn).getDay() === day)
        .sort((a, b) => {
          return new Date(a.scheduleOn) - new Date(b.scheduleOn)
        })
    },
  },
  watch: {
    startDate() {
      this.fetchSessions()
    },
  },
  computed: {
    mondayDate() {
      return new Date(this.startDate)
    },
    mondaySessions() {
      return this.filterSessionsByDay(1)
    },
    tuesdayDate() {
      return new Date(
        new Date(this.startDate).setDate(this.startDate.getDate() + 1),
      )
    },
    tuesdaySessions() {
      return this.filterSessionsByDay(2)
    },
    wednesdayDate() {
      return new Date(
        new Date(this.startDate).setDate(this.startDate.getDate() + 2),
      )
    },
    wednesdaySessions() {
      return this.filterSessionsByDay(3)
    },
    thursdayDate() {
      return new Date(
        new Date(this.startDate).setDate(this.startDate.getDate() + 3),
      )
    },
    thursdaySessions() {
      return this.filterSessionsByDay(4)
    },
    fridayDate() {
      return new Date(
        new Date(this.startDate).setDate(this.startDate.getDate() + 4),
      )
    },
    fridaySessions() {
      return this.filterSessionsByDay(5)
    },
    saturdayDate() {
      return new Date(
        new Date(this.startDate).setDate(this.startDate.getDate() + 5),
      )
    },
    saturdaySessions() {
      return this.filterSessionsByDay(6)
    },
    sundayDate() {
      return new Date(
        new Date(this.startDate).setDate(this.startDate.getDate() + 6),
      )
    },
    sundaySessions() {
      return this.filterSessionsByDay(0)
    },
  },
  components: {
    WeekSelector,
    SessionDayLine,
    Loading,
  },
}
</script>
