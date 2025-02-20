<template>
  <ErrorPage>
    <RouterLink to="/" class="btn primary">
      {{ $t("globalError.back_to_home") }}
    </RouterLink>
  </ErrorPage>
</template>
<script>
import ErrorPage from "../components/ErrorPage.vue"

export default {
  props: {},
  computed: {},
  components: {
    ErrorPage,
  },
}
</script>
