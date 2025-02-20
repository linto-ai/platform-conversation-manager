<template>
  <div class="flex col medium-padding gap-medium">
    <SessionChannelsSelector
      :channels="channels"
      v-model="p_selectedChannel"></SessionChannelsSelector>

    <SessionTranslationSelection
      :selectedChannel="selectedChannel"
      v-model="p_selectedTranslation"></SessionTranslationSelection>

    <h3>{{ $t("session.detail_page.title_interface_settings") }}</h3>
    <FormCheckbox
      :field="displayLiveTranscriptionField"
      switchDisplay
      v-model="displayLiveTranscriptionField.value" />
    <FormCheckbox
      :field="displaySubtitlesField"
      switchDisplay
      v-model="displaySubtitlesField.value" />

    <FormInput
      :field="fontSizeField"
      v-model="fontSizeField.value"
      v-if="displaySubtitlesField.value" />
  </div>
</template>
<script>
import { bus } from "../main.js"

import EMPTY_FIELD from "@/const/emptyField"
import FormInput from "@/components/FormInput.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"
import SessionTranslationSelection from "@/components/SessionTranslationSelection.vue"
import SessionChannelsSelector from "@/components/SessionChannelsSelector.vue"

export default {
  props: {
    selectedChannel: {
      type: Object,
      required: true,
    },
    selectedTranslation: {
      type: String,
      default: "original",
    },
    displayLiveTranscription: {
      type: Boolean,
      default: true,
    },
    displaySubtitles: {
      type: Boolean,
      default: true,
    },
    fontSize: {
      type: String,
      default: "40",
    },
    channels: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      fontSizeField: {
        ...EMPTY_FIELD,
        value: this.fontSize,
        label: this.$t("session.detail_page.font_size_label"),
        type: "number",
        customParams: {
          min: 12,
          max: 68,
        },
      },
      displaySubtitlesField: {
        ...EMPTY_FIELD,
        value: this.displaySubtitles,
        label: this.$t("session.detail_page.display_subtitles_label"),
      },
      displayLiveTranscriptionField: {
        ...EMPTY_FIELD,
        value: this.displayLiveTranscription,
        label: this.$t("session.detail_page.display_live_transcription_label"),
      },
      p_selectedTranslation: this.selectedTranslation,
      p_selectedChannel: this.selectedChannel,
    }
  },
  mounted() {},
  methods: {},
  watch: {
    selectedTranslation(value) {
      this.p_selectedTranslation = value
    },
    selectedChannel(value) {
      this.p_selectedChannel = value
    },
    displayLiveTranscription(value) {
      this.displayLiveTranscriptionField.value = value
    },
    displaySubtitles(value) {
      this.displaySubtitlesField.value = value
    },
    fontSize(value) {
      this.fontSizeField.value = value
    },
    p_selectedTranslation(value) {
      this.$emit("update:selectedTranslation", value)
    },
    p_selectedChannel(value) {
      this.$emit("update:selectedChannel", value)
    },
    "displayLiveTranscriptionField.value"(value) {
      this.$emit("update:displayLiveTranscription", value)
    },
    "displaySubtitlesField.value"(value) {
      this.$emit("update:displaySubtitles", value)
    },
    "fontSizeField.value"(value) {
      this.$emit("update:fontSize", value)
    },
  },
  components: {
    FormInput,
    FormCheckbox,
    SessionTranslationSelection,
    SessionChannelsSelector,
  },
}
</script>
