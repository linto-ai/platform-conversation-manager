<template>
  <div class="form-field flex gap-small" :class="{ col: !inline }">
    <div v-for="option in field.options" class="flex row align-top gap-small">
      <div class="flex align-center">
        <Radio
          v-model="value"
          :id="id + option.name"
          :radioValue="option.name"
          :disabled="option.disabled"
          :name="id"
          ref="input"></Radio>
      </div>
      <div class="flex row justify-center align-center">
        <label class="form-label" :for="id + option.name" v-if="option.label">
          {{ option.label }}
        </label>
        <label class="form-label" :for="id + option.name" v-else>
          {{ option.name }}
        </label>
        <slot name="content-after-label"></slot>
      </div>
    </div>

    <span class="error-field" v-if="field.error !== null">
      {{ field.error }}
    </span>
  </div>
</template>
<script>
import Radio from "./Radio.vue"
export default {
  props: {
    /*
      field: {
        value: "",
        error: "",
        options: [
          {
            name:"",
            label:""
            ?disabled
          }
        ]
      }
    */
    field: {
      type: Object,
      required: true,
    },
    inputId: {
      type: String,
      default: null,
    },
    inline: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      id: this.inputId || Math.random().toString(36).substr(2, 9),
    }
  },
  computed: {
    value: {
      get: function () {
        return this.field.value
      },
      set: function (value) {
        this.$emit("input", value)
      },
    },
  },
  mounted() {},
  methods: {},
  components: { Radio },
}
</script>
