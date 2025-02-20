<template>
  <div>
    <form @submit="updateName" v-if="!root">
      <section>
        <FormInput
          inputFullWidth
          :field="nameField"
          v-model="nameField.value" />
        <button type="submit" class="btn green">
          <span class="icon apply"></span>
          <span class="label">{{
            $t("conversation_overview.channel.apply_name")
          }}</span>
        </button>
      </section>
    </form>
    <section class="flex overview__main-section gap-medium" v-if="audio">
      <LabeledValue
        :label="$t('conversation_overview.audio.duration_label_inline')"
        :value="duration"></LabeledValue>
      <LabeledValue
        :label="$t('conversation_overview.audio.file_label_inline')">
        <button
          @click="downloadAudio"
          class="transparent inline"
          v-if="!loadingAudio">
          {{ fileName }}
        </button>
        <div v-else>
          {{ $t("conversation_overview.audio.loading_audio_file") }}
        </div>
      </LabeledValue>
    </section>
  </div>
</template>
<script>
import { bus } from "@/main.js"

import { getEnv } from "@/tools/getEnv"
import { timeToHMS } from "@/tools/timeToHMS"
import {
  apiGetAudioFileFromConversation,
  apiUpdateConversation,
} from "../api/conversation.js"
import LabeledValue from "@/components/LabeledValue.vue"
import EMPTY_FIELD from "@/const/emptyField"
import FormInput from "@/components/FormInput.vue"
import { testName } from "@/tools/fields/testName"

export default {
  props: {
    conversation: {
      type: Object,
      required: true,
    },
    root: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      loadingAudio: false,
      nameField: {
        ...EMPTY_FIELD,
        value: this.conversation.name,
        label: this.$t("conversation_overview.channel.name_label"),
        testField: testName,
      },
    }
  },
  mounted() {
    return {}
  },
  computed: {
    audio() {
      return this.conversation?.metadata?.audio
    },
    filePath() {
      const BASE_API = getEnv("VUE_APP_CONVO_API")

      return `${BASE_API}/conversations/${this.conversation._id}/media`
    },
    fileName() {
      return this.conversation?.metadata?.audio?.filename
    },
    duration() {
      return timeToHMS(this.conversation.metadata.audio.duration)
    },
  },
  methods: {
    async updateName(e) {
      e?.preventDefault()

      const res = await apiUpdateConversation(this.conversation._id, {
        name: this.nameField.value,
      })

      if (res.status === "error") {
        bus.$emit("app_notif", {
          status: "error",
          message: this.$i18n.t("conversation_overview.channel.error_notif"),
          redirect: false,
        })
      } else {
        bus.$emit("app_notif", {
          status: "success",
          message: this.$i18n.t("conversation_overview.channel.done_notif"),
          redirect: false,
        })
        this.$emit("update_channel_name", {
          id: this.conversation._id,
          newName: this.nameField.value,
        })
      }
      return false
    },
    async getAudioFile() {
      let req = await apiGetAudioFileFromConversation(
        this.conversationId,
        false,
      )
      if (req?.status === "success") {
        this.audioFile = URL.createObjectURL(req.data)
      }
    },
    async downloadAudio() {
      this.loadingAudio = true
      await this.getAudioFile()
      const link = document.createElement("a")
      link.href = this.audioFile
      link.download = this.fileName
      link.click()
      URL.revokeObjectURL(link.href)
      this.loadingAudio = false
    },
  },
  components: {
    LabeledValue,
    FormInput,
  },
}
</script>
