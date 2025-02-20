<template>
  <fieldset
    class="appointment-selector form-field"
    :class="{ errored: field.error && !readonly }">
    <legend class="form-label" v-if="label">{{ label }}</legend>
    <FormInput
      :field="fieldDate"
      v-model="fieldDate.value"
      ref=""
      :readonly="readonly"></FormInput>
    <div class="flex gap-medium">
      <FormInput
        class="flex1"
        :readonly="readonly"
        :field="fieldStartTimestamp"
        v-model="fieldStartTimestamp.value"></FormInput>
      <FormInput
        class="flex1"
        :readonly="readonly"
        :field="fieldEndTimestamp"
        v-model="fieldEndTimestamp.value"></FormInput>
    </div>
    <div class="appointment-selector__duration">
      {{ $t("appointment_selector.duration_label") }}
      <span v-if="timeDuration">{{ timeDuration }}</span>
      <span v-else>–</span>
    </div>
    <div class="error-field" v-if="field.error && !readonly">
      {{ field.error }}
    </div>
  </fieldset>
</template>
<script>
import FormInput from "@/components/FormInput.vue"
import EMPTY_FIELD from "@/const/emptyField"
import getFullDate from "@/tools/getFullDate"
import getTimeFromDate from "@/tools/getTimeFromDate"

export default {
  props: {
    // value is [start dateTime, end dateTime] => [js native Date,js native Date] // local time zone (need to be converted to UTC in the parent component)
    field: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const startDateTime = this.field.value
      ? (this.field.value?.[0] ?? null)
      : null
    const endDateTime = this.field.value
      ? (this.field.value?.[1] ?? null)
      : null

    const date = startDateTime ? getFullDate(startDateTime) : null
    const startTime = startDateTime ? getTimeFromDate(startDateTime) : null
    const endTime = endDateTime ? getTimeFromDate(endDateTime) : null

    return {
      fieldDate: {
        ...EMPTY_FIELD,
        value: date,
        label: this.$t("appointment_selector.date_label"),
        type: "date",
      },
      fieldStartTimestamp: {
        ...EMPTY_FIELD,
        value: startTime,
        label: this.$t("appointment_selector.start_time_label"),
        type: "time",
      },
      fieldEndTimestamp: {
        ...EMPTY_FIELD,
        value: endTime,
        label: this.$t("appointment_selector.end_time_label"),
        type: "time",
      },
      dateWarning: null,
    }
  },
  mounted() {},
  computed: {
    label() {
      return this.field?.label ?? null
    },
    startDateTime() {
      return this.fieldDate.value && this.fieldStartTimestamp.value
        ? new Date(this.fieldDate.value + " " + this.fieldStartTimestamp.value)
        : null
    },
    endDateTime() {
      return this.fieldDate.value && this.fieldEndTimestamp.value
        ? new Date(this.fieldDate.value + " " + this.fieldEndTimestamp.value)
        : null
    },
    timeDuration() {
      if (!this.fieldStartTimestamp.value || !this.fieldEndTimestamp.value) {
        return null
      }

      const startHours = parseInt(this.fieldStartTimestamp.value.split(":")[0])
      const startMinutes = parseInt(
        this.fieldStartTimestamp.value.split(":")[1],
      )
      let endHours = parseInt(this.fieldEndTimestamp.value.split(":")[0])
      let endMinutes = parseInt(this.fieldEndTimestamp.value.split(":")[1])

      if (endMinutes < startMinutes) {
        endHours -= 1
        endMinutes += 60
      }

      return `${endHours - startHours}h ${endMinutes - startMinutes}m`
    },
  },
  watch: {
    "fieldStartTimestamp.value"() {
      this.testSessionDates()
      this.$emit("input", [this.startDateTime, this.endDateTime])
    },
    "fieldEndTimestamp.value"() {
      this.testSessionDates()
      this.$emit("input", [this.startDateTime, this.endDateTime])
    },
    "fieldDate.value"() {
      this.testSessionDates()
      this.$emit("input", [this.startDateTime, this.endDateTime])
    },
    "field.value": {
      handler() {
        const startDateTime = this.field.value
          ? (this.field.value?.[0] ?? null)
          : null
        const endDateTime = this.field.value
          ? (this.field.value?.[1] ?? null)
          : null

        const date = startDateTime ? getFullDate(startDateTime) : null
        const startTime = startDateTime ? getTimeFromDate(startDateTime) : null
        const endTime = endDateTime ? getTimeFromDate(endDateTime) : null

        if (date) this.fieldDate.value = date

        if (startTime) this.fieldStartTimestamp.value = startTime

        if (endTime) this.fieldEndTimestamp.value = endTime
      },
      deep: true,
    },
  },
  methods: {
    testSessionDates() {
      if (!this.startDateTime || !this.endDateTime) {
        this.$emit("update:error", null)
        return
      }

      // Check that start is before end
      if (this.startDateTime >= this.endDateTime) {
        this.$emit(
          "update:error",
          this.$t("appointment_selector.error_end_time_before_start_time"),
        )
        return
      }

      // Check that date is in the future
      if (this.startDateTime < new Date()) {
        this.$emit(
          "update:error",
          this.$t("appointment_selector.error_past_date"),
        )
        return
      }

      this.$emit("update:error", null)
    },
  },
  components: {
    FormInput,
  },
}
</script>
