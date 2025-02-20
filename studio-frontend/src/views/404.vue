import { RouterLink } from 'vue-router';
<template>
  <div
    class="flex align-center justify-center flex1 col center-text gap-medium">
    <h2>{{ $t("globalError.page_not_found") }}</h2>
    <Svglogo style="max-height: 15rem" />

    <RouterLink to="/" class="btn primary">
      {{ $t("globalError.back_to_home") }}
    </RouterLink>
  </div>
</template>

<script>
import Svglogo from "@/svg/Desert.vue"

export default {
  props: {},
  mounted() {},
  methods: {},
  components: { Svglogo },
}
</script>
