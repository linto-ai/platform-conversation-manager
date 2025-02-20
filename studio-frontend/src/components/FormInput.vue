<template>
  <div class="form-field flex col" v-if="!readonly">
    <div class="flex row" v-if="field.label">
      <label class="form-label" :for="id">
        {{ field.label }}
      </label>
      <slot name="content-after-label"></slot>
    </div>

    <div class="flex gap-small align-center">
      <slot></slot>
      <input
        v-if="!textarea"
        :class="{
          fullwidth: inputFullWidth,
          flex1: true,
        }"
        :type="type"
        :disabled="disabled"
        :id="id"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        ref="input"
        v-model="value"
        @change="($event) => $emit('change', $event)"
        @keydown="keydown"
        v-bind="field.customParams" />
      <textarea
        v-else
        :class="{
          fullwidth: inputFullWidth,
          flex1: true,
        }"
        :disabled="disabled"
        :id="id"
        ref="input"
        v-model="value"
        @change="($event) => $emit('change', $event)"
        @keydown="keydown" />
      <div v-if="withConfirmation" class="flex gap-small">
        <button class="transparent inline" @click="cancel" title="cancel">
          <span class="icon medium close"></span>
        </button>
        <button class="transparent inline" @click="apply" title="apply">
          <span class="icon medium apply"></span>
        </button>
      </div>
      <slot name="content-after-input"></slot>
    </div>
    <slot name="content-bottom-input"></slot>
    <span class="error-field" v-if="field.error !== null">{{
      field.error
    }}</span>
  </div>
  <LabeledValue v-else :label="field.label" :value="field.value" />
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import LabeledValue from "@/components/LabeledValue.vue"
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
    withConfirmation: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    inputId: {
      type: String,
      default: null,
    },
    inputFullWidth: {
      type: Boolean,
      default: null,
    },
    focus: {
      type: Boolean,
      default: false,
    },
    textarea: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      value: this.field.value,
      id: this.inputId || Math.random().toString(36).substr(2, 9),
    }
  },
  computed: {
    type() {
      return this.field.type || "text"
    },
    autocomplete() {
      return this.field.autocomplete || null
    },
    placeholder() {
      return this.field?.placeholder || null
    },
  },
  watch: {
    value() {
      if (!this.withConfirmation) this.$emit("input", this.value)
    },
    "field.value"() {
      this.value = this.field.value
    },
  },
  mounted() {
    if (this.focus) {
      this.$nextTick(() => {
        this.$refs.input.focus()
      })
    }
  },
  methods: {
    apply(e) {
      e && e.stopPropagation()
      this.$emit("input", this.value)
      this.$emit("on-confirm", e)
    },
    cancel(e) {
      e && e.stopPropagation()
      this.value = this.field.value
      this.$emit("on-cancel", e)
    },
    keydown(e) {
      if (e.key == "Enter") {
        this.apply()
      } else if (e.key == "Escape") {
        this.cancel()
      }
      e.stopPropagation()
    },
  },
  components: { Fragment, LabeledValue },
}
</script>
