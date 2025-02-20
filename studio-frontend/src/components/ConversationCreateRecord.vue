<template>
  <div
    class="flex col justify-center align-center audio-upload__record"
    @click="recording ? stopRecording() : startRecording()">
    <div class="btn green audio-upload__record__button" v-if="!recording">
      <span class="icon record audio-upload__record__icon"></span>
    </div>
    <div class="btn green audio-upload__record__button" v-else>
      <span class="icon stop audio-upload__record__icon"></span>
    </div>
    <label from for="record" class="label">
      {{ recording ? $t("conversation.recording") : $t("conversation.record") }}
    </label>
  </div>
  <!-- <div class="flex col">
    <div class="flex row">
      <button
        @click="recording ? stopRecording() : startRecording()"
        type="button"
        :disabled="disabled"
        class="btn black">
        <span class="icon record"></span>
        <span class="label">
          {{
            recording ? $t("conversation.recording") : $t("conversation.record")
          }}
        </span>
      </button>
    </div>
    <span class="error-field" v-if="audioRecFile.error !== null">
      {{ audioRecFile.error }}
    </span>
  </div> -->
</template>
<script>
import WebVoiceSDK from "@linto-ai/webvoicesdk"
import EMPTY_FIELD from "@/const/emptyField.js"
import { audioDuration } from "@/tools/audioDuration.js"

export default {
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      audioRecFile: { ...EMPTY_FIELD },
      recorder: null,
      mic: null,
      downSampler: null,
      recording: false,
      audioBufferAvailable: false,
    }
  },
  created() {
    this.recorder = new WebVoiceSDK.Recorder()
    this.mic = new WebVoiceSDK.Mic()
  },
  methods: {
    select() {
      this.$emit("selected", { name: this.name })
    },
    async initMicrophone() {
      if (this.mic.status != "emitting") {
        await this.mic.start()
        await this.recorder.start(this.mic)
      }
    },
    async startRecording() {
      if (this.disabled) return

      await this.initMicrophone()
      try {
        this.recorder.cleanBuffer()
        this.audioRecFile.error = null
        this.audioBufferAvailable = false
        this.recorder.punchIn()
        this.recording = true
      } catch (error) {
        console.error(error)
      }
    },
    async stopRecording() {
      try {
        this.recorder.punchOut()
        this.recording = false
        this.audioBufferAvailable = true
        this.handleRecord()
      } catch (error) {
        console.error(error)
      }
    },
    replay() {
      this.recorder.play()
    },
    async getRecFile() {
      try {
        let wavFile = this.recorder.getWavFile()
        return new File([wavFile], `record-${Date.now()}.wav`)
      } catch (error) {
        console.error(error)
        return false
      }
    },
    async handleRecord() {
      let recFile = await this.getRecFile()
      if (!recFile) {
        this.audioRecFile.value = ""
        this.audioRecFile.error = "Please record something"
        this.audioRecFile.valid = false
      } else if ((await audioDuration(this.recorder.getWavFile())) < 3) {
        this.audioRecFile.value = ""
        this.audioRecFile.error = "Record is too short"
        this.audioRecFile.valid = false
      } else {
        this.audioRecFile.value = recFile
        this.audioRecFile.error = null
        this.audioRecFile.valid = true
        this.$emit("input", this.audioRecFile.value)
      }
    },
  },
}
</script>
