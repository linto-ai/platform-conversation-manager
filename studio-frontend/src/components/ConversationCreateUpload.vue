<template>
  <Droparea
    :accepts="['audio/*', 'video/*']"
    :multiple="multipleFiles"
    @drop="handleFileUpload"
    @error="handleError($event)">
    <div>{{ $t("conversation_creation.file.drop_audio") }}</div>
  </Droparea>
</template>
<script>
import EMPTY_FIELD from "@/const/emptyField.js"
import Droparea from "./Droparea.vue"
export default {
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    multipleFiles: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      audioFile: { ...EMPTY_FIELD },
    }
  },
  methods: {
    handleFileUpload(files) {
      //const files = this.$refs.file.files
      this.audioFile.error = null
      this.audioFile.valid = true
      // file type is already checked by the input accept attribute so we don't need to check it again
      const filesArray = Array.from(files)
      // TODO with server answer
      // for (const file of filesArray) {
      //   if (file.size > 1000000) {
      //     this.audioFile.error = this.$t("conversation.audio_file_too_big")
      //     this.audioFile.valid = false
      //     break
      //   }
      // }
      if (this.audioFile.valid) {
        this.$emit("input", filesArray)
      }
    },
  },
  components: {
    Droparea,
  },
}
</script>
