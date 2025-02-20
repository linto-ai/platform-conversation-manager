<template>
  <CustomSelect
    :valueText="localTxt"
    :value="local"
    icon="flag"
    iconText="Lang"
    aria-label="Language selector"
    :options="{
      lang: [
        { value: 'fr-FR', text: 'Français' },
        { value: 'en-US', text: 'English' },
      ],
    }"
    @input="setLocale" />
</template>
<script>
import { bus } from "../main.js"
import CustomSelect from "./CustomSelect.vue"

export default {
  watch: {
    "$i18n.locale": function (newVal) {
      localStorage.setItem("lang", newVal)
      //reload page
      location.reload()
    },
  },
  computed: {
    localTxt() {
      return this.$i18n.locale === "fr-FR" ? "Français" : "English"
    },
    local() {
      return this.$i18n.locale
    },
  },
  methods: {
    setLocale(locale) {
      this.$i18n.locale = locale
      this.showList = false
    },
  },
  components: {
    CustomSelect,
  },
}
</script>
