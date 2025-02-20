<template>
  <div class="form-field" :select-like="selectLike">
    <div class="form-label">{{ label }}</div>
    <div class="form-value" v-if="hasSlot">
      <slot></slot>
    </div>
    <div class="form-value" v-else>{{ value }}</div>
  </div>
</template>
<script>
export default {
  props: {
    value: { required: false },
    label: { required: false },
    selectLike: { type: Boolean, default: false },
  },
  computed: {
    hasSlot() {
      return !!this.$slots.default
    },
  },
}
</script>
