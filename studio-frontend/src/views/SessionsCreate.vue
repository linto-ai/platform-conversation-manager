<template>
  <MainContent sidebar box>
    <SessionCreateContent
      :currentOrganizationScope="currentOrganizationScope" />
  </MainContent>
</template>
<script>
import MainContent from "@/components/MainContent.vue"
import SessionCreateContent from "@/components/SessionCreateContent.vue"

export default {
  mixins: [],
  props: {
    currentOrganizationScope: {
      type: String,
      required: true,
    },
  },
  data() {
    return {}
  },
  watch: {},
  mounted() {},
  methods: {},
  components: {
    MainContent,
    SessionCreateContent,
  },
}
</script>
