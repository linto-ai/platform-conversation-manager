<template>
  <div class="flex flex1">
    <BackofficeSidebar />
    <main class="flex1 backoffice-main">
      <slot name="header"></slot>
      <slot v-if="!loading"></slot>
      <Loading v-else />
    </main>
  </div>
</template>
<script>
import BackofficeSidebar from "@/components/BackofficeSidebar.vue"
import Loading from "@/components/Loading.vue"

export default {
  props: {
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: { BackofficeSidebar, Loading },
}
</script>
