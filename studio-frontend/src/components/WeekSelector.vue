<template>
  <div class="flex align-center justify-center gap-medium">
    <button
      class="icon-only"
      @click="previousWeek"
      :title="$t('week_selector.previous_button_title')">
      <span class="icon left-arrow"></span>
    </button>
    <h3 style="width: auto">
      <!-- Week {{ weekNumber }} of {{ year }} from {{ firstDay }} to {{ lastDay }} -->
      {{
        $t("week_selector.main_label", {
          weekNumber,
          year,
          startDate: firstDay,
          endDate: lastDay,
        })
      }}
    </h3>
    <button
      class="icon-only"
      @click="nextWeek"
      :title="$t('week_selector.next_button_title')">
      <span class="icon right-arrow"></span>
    </button>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import getWeekNumberFromDate from "@/tools/getWeekNumberFromDate.js"
import getDayListFromWeekNumber from "@/tools/getDayListFromWeekNumber.js"

export default {
  props: {
    value: {
      type: Date,
      required: true,
    }, // first day of the week
  },
  data() {
    return {}
  },
  computed: {
    weekNumber() {
      return getWeekNumberFromDate(this.value)
    },
    year() {
      return this.value.getFullYear()
    },
    datesOfweek() {
      return getDayListFromWeekNumber(this.weekNumber, this.year)
    },
    firstDay() {
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }

      return this.datesOfweek[0].toLocaleDateString(undefined, options)
    },
    lastDay() {
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }

      return this.datesOfweek[6].toLocaleDateString(undefined, options)
    },
  },
  mounted() {},
  methods: {
    previousWeek() {
      const previousWeek = new Date(this.datesOfweek[0])
      previousWeek.setDate(previousWeek.getDate() - 7)
      this.$emit("input", previousWeek)
    },
    nextWeek() {
      const nextWeek = new Date(this.datesOfweek[0])
      nextWeek.setDate(nextWeek.getDate() + 7)
      this.$emit("input", nextWeek)
    },
  },
  components: { Fragment },
}
</script>
