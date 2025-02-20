<template>
  <div class="flex col flex1 align-center justify-center">
    <h2 class="center-text">{{ $t("error.server_error.title") }}</h2>
    <Svglogo style="height: 8rem" />
    <p>
      {{ $t("error.server_error.subtitle") }}
    </p>
    <slot></slot>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import Svglogo from "@/svg/Raining.vue"

export default {
  props: {},
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: { Fragment, Svglogo },
}
</script>
