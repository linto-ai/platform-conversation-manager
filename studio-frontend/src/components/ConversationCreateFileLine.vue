<template>
  <li class="relative">
    <FormInput
      :field="field"
      v-model="field.value"
      :disabled="disabled"
      inputFullWidth>
      <div
        class="flex"
        :title="$t('conversation_creation.offline.label_icon_source.file')"
        v-if="uploadType == 'file'">
        <span
          class="icon file-audio secondary"
          :alt="
            $t('conversation_creation.offline.label_icon_source.file')
          "></span>
      </div>
      <div
        class="flex"
        :title="
          $t('conversation_creation.offline.label_icon_source.microphone')
        "
        v-if="uploadType == 'microphone'">
        <span
          class="icon record secondary"
          :alt="
            $t('conversation_creation.offline.label_icon_source.microphone')
          "></span>
      </div>
      <div
        class="flex"
        :title="$t('conversation_creation.offline.label_icon_source.url')"
        v-if="uploadType == 'url'">
        <span
          class="icon link secondary"
          :alt="
            $t('conversation_creation.offline.label_icon_source.url')
          "></span>
      </div>

      <button
        class="btn black"
        @click="deleteFile"
        v-if="!disabled"
        type="button">
        <span class="icon trash"></span>
      </button>
      <button
        type="button"
        class="btn black"
        @click="playOrStopFile"
        v-if="!disabled">
        <span :class="`icon ${isPlaying ? 'pause' : 'play'}`"></span>
      </button>
    </FormInput>
    <progress
      v-if="disabled"
      class="hoverInput fullwidth audio-upload-list__progress"
      max="100"
      :value="field.progress"></progress>
  </li>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import FormInput from "@/components/FormInput.vue"

export default {
  props: {
    field: {
      type: Object,
      required: true,
    },
    isPlaying: {
      type: Boolean,
      required: true,
    },
    disabled: {
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
    uploadType() {
      return this.field?.uploadType || "file"
    },
  },
  methods: {
    deleteFile(event) {
      event.preventDefault()
      this.$emit("deleteFile", event)
    },
    stopFile(event) {
      event.preventDefault()
      this.$emit("stopFile", event)
    },
    playFile(event) {
      event.preventDefault()

      this.$emit("playFile", event)
    },
    playOrStopFile(event) {
      event.preventDefault()
      if (this.isPlaying) {
        this.stopFile(event)
      } else {
        this.playFile(event)
      }
    },
  },
  components: { Fragment, FormInput },
}
</script>
