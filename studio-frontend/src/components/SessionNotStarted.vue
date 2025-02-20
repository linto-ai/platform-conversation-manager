<template>
  <div class="flex flex1 align-center justify-center center-text">
    <h2>{{ $t("session.detail_page.session_not_started_title") }}</h2>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
export default {
  props: {},
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: { Fragment },
}
</script>
