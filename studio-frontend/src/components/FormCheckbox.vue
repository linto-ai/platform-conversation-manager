<template>
  <div class="form-field flex row align-center form-field-checkbox gap-small">
    <div class="flex align-center">
      <!-- <input
        type="checkbox"
        ref="input"
        v-model="value"
        :id="id"
        v-if="!switchDisplay" /> -->
      <Checkbox
        :title="p_disabled ? p_disabledReason : ''"
        v-model="value"
        :id="id"
        v-if="!switchDisplay"
        :disabled="p_disabled" />
      <SwitchInput
        :disabled="p_disabled"
        v-model="value"
        :id="id"
        v-else
        style="margin-right: 0.5rem" />
    </div>

    <div
      class="flex row"
      v-if="field.label"
      :title="p_disabled ? p_disabledReason : ''">
      <label class="form-label" :for="id">
        {{ field.label }}
      </label>
      <slot name="content-after-label"></slot>
    </div>

    <span class="error-field" v-if="field.error !== null">{{
      field.error
    }}</span>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import LabeledValue from "@/components/LabeledValue.vue"
import SwitchInput from "@/components/SwitchInput.vue"
import Checkbox from "./Checkbox.vue"
export default {
  props: {
    /*
      A field contains:
      - label: string (optional)
      - value: string
      - error: string (optional)
      TODO: add validator : https://vuejs.org/guide/components/props.html#prop-validation
    */
    field: {
      type: Object,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    inputId: {
      type: String,
      default: null,
    },
    switchDisplay: {
      type: Boolean,
      default: false,
    },
    disabledReason: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      value: this.field.value,
      id: this.inputId || Math.random().toString(36).substr(2, 9),
    }
  },
  watch: {
    value() {
      this.$emit("input", this.value)
    },
    "field.value"() {
      this.value = this.field.value
    },
  },
  computed: {
    p_disabled() {
      return this.disabled || this.field.disabled
    },
    p_disabledReason() {
      return this.disabledReason || this.field.disabledReason
    },
  },
  methods: {},
  components: { Fragment, LabeledValue, SwitchInput, Checkbox },
}
</script>
