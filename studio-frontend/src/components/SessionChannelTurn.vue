<template>
  <div class="channel-turn">
    <div class="flex col channel-turn__metadata">
      <span class="channel-turn__speaker">{{ speaker }}</span>
      <span class="channel-turn__lang">{{ lang }}</span>
      <span class="channel-turn__time">{{ time }}</span>
    </div>
    <div class="channel-turn__text" :selected="selected" @click="onClick">
      {{ text }}
    </div>
  </div>
</template>
<script>
import { bus } from "../main.js"
import getTextTurnWithTranslation from "@/tools/getTextTurnWithTranslation.js"
export default {
  props: {
    turn: {
      type: Object,
      required: true,
    },
    selectedTranslations: {
      type: String,
      required: false,
      default: "original",
    },
    selected: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {}
  },
  mounted() {},
  computed: {
    text() {
      return getTextTurnWithTranslation(this.turn, this.selectedTranslations)
    },
    speaker() {
      if (this.selectedTranslations !== "original") {
        let languageNames = new Intl.DisplayNames([this.$i18n.locale], {
          type: "language",
        })
        return this.$t("session.detail_page.translation_bot")
      }

      return (
        this.turn?.locutor || this.$t("session.detail_page.undefined_speaker")
      )
    },
    lang() {
      return this.turn.lang || this.$t("session.detail_page.undefined_lang")
    },
    time() {
      if (!this.turn.astart) return "00:00:00"
      return new Date(
        new Date(this.turn.astart).getTime() + this.turn.start * 1000,
      ).toLocaleTimeString()
    },
  },
  methods: {
    onClick(e) {
      this.$emit("select", e)
    },
  },
  components: {},
}
</script>
