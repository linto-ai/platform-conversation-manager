<template>
  <MainContent noBreadcrumb :organizationPage="false" fullwidthContent sidebar>
    <template v-slot:sidebar>
      <div class="session-microphone-status" @click="toggleMicrophone">
        <div class="flex align-center gap-small center-text">
          <StatusLed :on="speaking" v-if="isRecording" />
          <span class="icon record-off" v-else />

          <span v-if="!channelWebsocket.state.isConnected">
            {{ $t("quick_session.live.status_no_websocket") }}
          </span>
          <span class="flex1" v-else-if="isRecording">{{
            $t("quick_session.live.status_recording")
          }}</span>
          <span class="flex1" v-else>
            {{ $t("quick_session.live.status_muted") }}
          </span>
        </div>
      </div>
      <SessionLiveToolbar
        :channels="channels"
        v-bind:selectedTranslation.sync="selectedTranslation"
        v-bind:displayLiveTranscription.sync="displayLiveTranscription"
        v-bind:displaySubtitles.sync="displaySubtitles"
        v-bind:fontSize.sync="fontSize"
        v-bind:selectedChannel.sync="selectedChannel" />
    </template>
    <template v-slot:breadcrumb-actions>
      <slot name="breadcrumb-actions"></slot>
    </template>
    <SessionLiveContent
      :organizationId="currentOrganizationScope"
      displayLiveTranscription
      :session="session"
      :displaySubtitles="displaySubtitles"
      :displayLiveTranscription="displayLiveTranscription"
      :fontSize="fontSize"
      customTitle="Quick meeting"
      :selectedTranslations="selectedTranslation"
      :selectedChannel="selectedChannel" />
  </MainContent>
</template>
<script>
import { bus } from "../main.js"

import { sessionModelMixin } from "@/mixins/sessionModel.js"
import { microphoneMixin } from "@/mixins/microphone.js"

import ChannelWS from "@/models/ChannelWS.js"
import { customDebug } from "@/tools/customDebug.js"

import MainContent from "@/components/MainContent.vue"
import SessionLiveToolbar from "@/components/SessionLiveToolbar.vue"
import SessionLiveContent from "@/components/SessionLiveContent.vue"
import StatusLed from "@/components/StatusLed.vue"

const EVENT_TO_LISTEN = "downSamplerFrame"

export default {
  mixins: [sessionModelMixin, microphoneMixin],
  props: {
    session: {
      type: Object,
      required: true,
    },
    currentOrganizationScope: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
  },
  data() {
    const currentChannel = this.session.channels[0]
    return {
      debugQuickSession: customDebug("vue:debug:quickSession"),
      selectedTranslation: "original",
      displayLiveTranscription: true,
      displaySubtitles: true,
      fontSize: "40",
      selectedChannel: currentChannel,
      channelWebsocket: new ChannelWS(currentChannel),
      isRecording: false,
    }
  },
  mounted() {
    window.addEventListener("beforeunload", this.onbeforeunload)
    this.setup()
  },
  methods: {
    onbeforeunload(event) {
      event.preventDefault()
      event.returnValue = ""
    },
    async onClose() {
      this.channelWebsocket.close()
      this.downSampler.removeEventListener(
        EVENT_TO_LISTEN,
        this.onAudioFrameRaw,
      )
      window.removeEventListener("beforeunload", this.onbeforeunload)
    },
    async setup() {
      await this.connectToMicrophone(this.deviceId)

      this.connectToWebsocket()
        .then(() => {
          this.debugQuickSession("Connected to websocket")
          this.setupRecordRaw()
        })
        .catch((error) => {
          console.error("Error while connecting to websocket", error)
        })
    },
    async connectToWebsocket() {
      const initMessage = {
        type: "init",
        sampleRate: 16000,
        encoding: "pcm", // Spécifie que les données sont en PCM brut
      }

      await this.channelWebsocket.connectWithConfig(initMessage)
    },
    async setupRecordRaw() {
      this.debugQuickSession("Starting downsampler")
      await this.downSampler.start(this.mic)
      this.downSampler.addEventListener(EVENT_TO_LISTEN, this.onAudioFrameRaw)
      this.isRecording = true
    },
    onAudioFrameRaw(event) {
      if (this.vad.speaking && this.isRecording) {
        this.channelWebsocket.send(event.detail)
      }
    },
    toggleMicrophone() {
      if (this.channelWebsocket.state.isConnected) {
        this.isRecording = !this.isRecording
      }
    },
  },
  components: {
    MainContent,
    SessionLiveToolbar,
    SessionLiveContent,
    StatusLed,
  },
}
</script>
