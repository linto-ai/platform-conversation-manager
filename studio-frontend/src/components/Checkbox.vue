<template>
  <div class="custom-checkbox flex">
    <input
      type="checkbox"
      :id="id"
      :name="name"
      :checked="value"
      :disabled="disabled"
      :value="checkboxValue"
      v-model="_value" />
    <label :for="id">
      <span class="custom-checkbox__check"></span>
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
    checkboxValue: { type: [String, Object, Number], default: null },
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
        if (this.disabled) return
        this.$emit("input", value)
      },
    },
  },
  components: { Fragment },
}
</script>
