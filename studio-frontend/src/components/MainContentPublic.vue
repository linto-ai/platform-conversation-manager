<template>
  <div class="flex login-page">
    <div class="login-page__decoration flex col flex1">
      <div
        class="login-page__decoration__header center-text flex col gap-small align-center">
        <img :src="logo" class="login-page__logo" />
        <h1 class="center-text login-page__main-title">
          {{ title }}
        </h1>
      </div>
      <div
        class="flex flex1 col justify-center align-center gap-medium reset-overflows">
        <div class="login-page__decoration__slogan">
          <h3 class="flex align-center gap-small">
            <span class="icon large record"></span
            ><span>{{ $t("login.teaser.transcribe.title") }}</span>
          </h3>
          <p>{{ $t("login.teaser.transcribe.desc") }}</p>
        </div>
        <div class="login-page__decoration__slogan">
          <h3 class="flex align-center gap-small">
            <span class="icon large edit"></span
            ><span>{{ $t("login.teaser.collaborate.title") }}</span>
          </h3>
          <p>{{ $t("login.teaser.collaborate.desc") }}</p>
        </div>
        <div class="login-page__decoration__slogan">
          <h3 class="flex align-center gap-small">
            <span class="icon large subtitle"></span
            ><span>{{ $t("login.teaser.ia.title") }}</span>
          </h3>
          <p>
            {{ $t("login.teaser.ia.desc") }}
          </p>
        </div>
      </div>
    </div>

    <div class="login-page__content flex col">
      <div class="flex col align-center">
        <LocalSwitcher></LocalSwitcher>
      </div>
      <div class="flex col flex1 justify-center align-center reset-overflows">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script>
import LocalSwitcher from "@/components/LocalSwitcher.vue"
import { getEnv } from "@/tools/getEnv"

export default {
  props: {},
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  computed: {
    title() {
      return getEnv("VUE_APP_NAME")
    },
    logo() {
      return `/img/${getEnv("VUE_APP_LOGO")}`
    },
  },
  components: { LocalSwitcher },
}
</script>
