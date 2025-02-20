<template>
  <div class="switch">
    <input
      type="checkbox"
      :disabled="disabled"
      :id="id"
      :name="name"
      :checked="value"
      :value="checkboxValue"
      v-model="_value" />
    <label :for="id">
      <div class="switch__slider"></div>
    </label>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
export default {
  props: {
    value: { type: [Boolean, Array], default: false },
    id: { type: String, default: "" },
    name: { type: String, default: "" },
    checkboxValue: { type: String, default: null },
    disabled: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  computed: {
    _value: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  components: { Fragment },
}
</script>
