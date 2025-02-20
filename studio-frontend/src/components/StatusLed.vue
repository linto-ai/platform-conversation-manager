<template>
  <span class="status-led" v-if="on" />
  <span class="status-led status-led--disable" v-else />
</template>
<script>
export default {
  props: {
    on: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: {},
}
</script>
