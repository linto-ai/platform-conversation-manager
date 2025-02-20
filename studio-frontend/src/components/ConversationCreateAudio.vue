<template>
  <div class="form-field flex col gap-medium no-margin">
    <!-- <h3>Uploaded media</h3> -->
    <!-- File list -->
    <!-- TODO: find a real unique key (hash + date upload ?) -->
    <ul class="audio-upload-list flex1" v-if="value && value.length > 0">
      <ConversationCreateFileLine
        v-for="(field, index) of value"
        :key="field.id"
        :field="field"
        :isPlaying="index === indexPlaying"
        :disabled="disabled"
        @deleteFile="deleteFile(index, $event)"
        @playFile="playFile(index, $event)"
        @stopFile="stopFile($event)" />
    </ul>

    <div class="flex">
      <div class="flex audio-upload-form subSection flex1">
        <ConversationCreateUpload
          v-if="uploadType === 'file'"
          class="flex1"
          :disabled="disabled"
          @input="uploadFile"
          :multipleFiles="multipleFiles" />
        <ConversationCreateRecord
          v-else-if="uploadType === 'microphone'"
          class="flex1"
          :disabled="disabled"
          @input="recordFile" />
        <ConversationCreateLink
          v-else-if="uploadType === 'url'"
          class="flex1"
          :disabled="disabled"
          @input="addUrl" />
      </div>
      <TabsVertical
        :tabs="uploadTabs"
        v-model="uploadType"
        class="upload-tabs" />
    </div>
  </div>
</template>
<script>
import EMPTY_FIELD from "@/const/emptyField"
import { generateFileField } from "@/tools/generateFileField.js"

import ConversationCreateUpload from "@/components/ConversationCreateUpload.vue"
import ConversationCreateRecord from "@/components/ConversationCreateRecord.vue"
import ConversationCreateLink from "@/components/ConversationCreateLink.vue"
import FormInput from "@/components/FormInput.vue"
import ConversationCreateFileLine from "@/components/ConversationCreateFileLine.vue"
import TabsVertical from "@/components/TabsVertical.vue"

export default {
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    value: {
      required: true,
    },
    // mode: {
    //   type: String,
    //   required: false,
    //   default: "file",
    // },
  },
  data() {
    return {
      mediaType: "file",
      indexPlaying: -1,
      multipleFiles: true, //process.env.VUE_APP_MULTIFILE == "true",
      uploadTabs: [
        {
          icon: "upload",
          label: this.$t("conversation_creation.offline.tabs_upload.file"),
          name: "file",
        },
        {
          icon: "record",
          label: this.$t(
            "conversation_creation.offline.tabs_upload.microphone",
          ),
          name: "microphone",
        },
        {
          icon: "link",
          label: this.$t("conversation_creation.offline.tabs_upload.url"),
          name: "url",
        },
      ],
      uploadType: "file",
    }
  },
  beforeDestroy() {
    this.stopFile()
  },
  methods: {
    uploadFile(file) {
      if (this.disabled) return
      if (this.multipleFiles) {
        this.AddMultipleFiles(file, "file")
      } else {
        this.AddSingleFile(file, "file")
      }
    },
    recordFile(file) {
      if (this.disabled) return
      if (this.multipleFiles) {
        this.AddMultipleFiles(file, "microphone")
      } else {
        this.AddSingleFile(file, "microphone")
      }
    },
    addUrl(url) {
      this.$emit("input", [
        ...this.value,
        {
          value: url,
          file: url,
          uploadType: "url",
          id: Math.random().toString(36).substring(2),
          progress: 0,
        },
      ])
    },
    AddMultipleFiles(file, uploadType = "file") {
      if (typeof file === "object" && file.length !== undefined) {
        const filesArray = Array.from(file)
        this.$emit("input", [
          ...this.value,
          ...filesArray.map((f) =>
            generateFileField(this.removeFileExtension(f.name), f, uploadType),
          ),
        ])
      } else {
        this.$emit("input", [
          ...this.value,
          generateFileField(
            this.removeFileExtension(file.name),
            file,
            uploadType,
          ),
        ])
      }
    },
    AddSingleFile(file, uploadType = "file") {
      this.stopFile()
      if (typeof file === "object" && file.length !== undefined) {
        this.$emit("input", [
          generateFileField(
            this.removeFileExtension(file[0].name),
            file[0],
            uploadType,
          ),
        ])
      } else {
        this.$emit("input", [
          generateFileField(
            this.removeFileExtension(file.name),
            file,
            uploadType,
          ),
        ])
      }
    },
    deleteFile(index, event) {
      if (this.disabled) return

      if (this.indexPlaying === index) {
        this.stopFile()
      }
      this.value.splice(index, 1)
      this.$emit("input", this.value)
    },
    playFile(index, event) {
      const file = this.value[index].file
      const uploadType = this.value[index]?.uploadType ?? "file"

      this.stopFile()

      if (uploadType === "url") {
        this.openExternal(file)
      } else {
        this.audio = new Audio(URL.createObjectURL(file))
        this.audio.onended = () => {
          this.stopFile()
        }
        this.indexPlaying = index
        this.audio.play()
      }
    },
    stopFile(event) {
      if (this.audio) {
        this.audio.pause()
        URL.revokeObjectURL(this.value[this.indexPlaying].file)
        this.audio = null
      }
      this.indexPlaying = -1
    },
    removeFileExtension(filename) {
      return filename.replace(/\.[^/.]+$/, "")
    },
    openExternal(url) {
      window.open(url, "_blank")
    },
  },
  components: {
    ConversationCreateUpload,
    ConversationCreateRecord,
    FormInput,
    ConversationCreateFileLine,
    ConversationCreateLink,
    TabsVertical,
  },
}
</script>
