import WebVoiceSDK from "@linto-ai/webvoicesdk"

export const microphoneMixin = {
  data() {
    return {
      recorder: null,
      downSampler: null,
      mic: null,
      vad: null,
      speaking: false,
    }
  },
  mounted() {
    this.recorder = new WebVoiceSDK.Recorder()
    this.downSampler = new WebVoiceSDK.DownSampler({
      targetSampleRate: 16000,
      targetFrameSize: 4096,
      Int16Convert: true,
    })
    this.mic = new WebVoiceSDK.Mic({
      frameSize: 4096,
    })
    this.vad = new WebVoiceSDK.Vad({
      threshold: 0.85,
      timeAfterStop: 1000,
    })
    this.vad.addEventListener("speakingStatus", this.p_onVadEvent.bind(this))
  },
  destroyed() {
    this.p_close()
  },
  methods: {
    p_close() {
      this.vad.removeEventListener("speakingStatus", this.p_onVadEvent)
      if (this.vad.stop) {
        this.vad.stop()
      }

      if (this.mic.stop) {
        this.mic.stop()
      }

      if (this.recorder?.stop) {
        this.recorder.stop()
      }

      if (this.onClose) {
        this.onClose()
      }
    },
    p_onVadEvent(e) {
      const speaking = !!e.detail
      this.speaking = speaking
      if (this.onVadEvent) {
        this.onVadEvent(speaking)
      }
    },
    async connectToMicrophone(deviceId) {
      const deviceIdConfig =
        deviceId && deviceId !== "default" ? { exact: deviceId } : null

      await this.mic.stop()
      await this.vad.stop()
      await this.downSampler.stop()
      await this.mic.start(deviceIdConfig, {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      })
      //
      this.vad.start(this.mic)
      this.microphoneWorked = false
    },
  },
}
