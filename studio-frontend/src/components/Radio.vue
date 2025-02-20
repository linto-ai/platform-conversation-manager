<template>
  <div class="custom-radio flex">
    <input
      type="radio"
      :id="id"
      :name="name"
      :checked="value"
      :disabled="disabled"
      :value="radioValue"
      v-model="_value" />
    <label :for="id">
      <span class="custom-radio__check"></span>
    </label>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
export default {
  props: {
    value: { type: [String, Object, Number], default: null },
    id: { type: String, default: "" },
    radioValue: { type: [String, Object, Number], default: null },
    disabled: { type: Boolean, default: false },
    name: { type: String, required: true },
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
