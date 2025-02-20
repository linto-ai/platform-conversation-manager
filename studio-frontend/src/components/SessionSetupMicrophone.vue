<template>
  <MainContent :sidebar="!recover" box>
    <h1 class="medium-margin-top" v-if="recover">
      {{ $t("quick_session.restore.title") }}
    </h1>
    <div v-if="recover">
      {{ $t("quick_session.restore.subtitle") }}
    </div>
    <div
      class="flex col center-text flex1 align-center justify-center permission-microphone"
      v-if="waitingPermission">
      <h2>
        {{ $t("quick_session.setup_microphone.waiting_permission_title") }}
      </h2>
      <img class="illustration" src="/img/microphone-illustration.svg" />
    </div>
    <!-- ERROR -->
    <div
      v-else-if="error"
      class="flex col center-text flex1 align-center justify-center permission-microphone-error">
      <h2>
        {{ $t("quick_session.setup_microphone.microphone_error_first_line") }}
        <br />
        {{ $t("quick_session.setup_microphone.microphone_error_second_line") }}
      </h2>
      <img class="illustration" src="/img/lsf-hello.svg" />
    </div>
    <div v-else class="flex col">
      <!-- SELECTION MICRO-->
      <section class="flex col gap-small">
        <div class="form-field flex col medium-margin-top">
          <label>{{
            $t("quick_session.setup_microphone.microphone_select_label")
          }}</label>
          <CustomSelect
            :options="optionsDeviceList"
            v-model="selectedDeviceId"
            class="fullwidth" />
        </div>
      </section>
      <!-- TEST MICROPHONE SECTION-->
      <section class="flex col gap-small">
        <h2>{{ selectedMicroName }}</h2>
        <div>
          {{ $t("quick_session.setup_microphone.sound_detector_headline") }}
        </div>

        <div
          class="microphone-sound-detector"
          :microphoneWorked="microphoneWorked">
          <div class="form-field flex col">
            <div class="flex align-center gap-small">
              <label>
                {{ $t("quick_session.setup_microphone.sound_detector_label") }}
              </label>
              <StatusLed :on="speaking" />
            </div>
            <div v-if="microphoneWorked">
              {{ $t("quick_session.setup_microphone.sound_detector_value_ok") }}
              <span class="icon apply microphone-sound-detector__ok-icon" />
            </div>
            <div v-else>
              {{
                $t("quick_session.setup_microphone.sound_detector_value_wait")
              }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="flex medium-margin-top" v-if="!recover">
      <button class="btn secondary" @click="trashSession">
        <span class="icon back"></span>
        <span class="label">{{
          $t("quick_session.setup_microphone.back")
        }}</span>
      </button>
      <div class="flex1"></div>
      <button class="btn" :disabled="!microphoneWorked" @click="setupSession">
        <span class="icon apply"></span>
        <span class="label"
          >{{ $t("quick_session.setup_microphone.start_meeting") }}
        </span>
      </button>
    </div>

    <div class="flex medium-margin-top gap-small" v-else>
      <button class="btn secondary" @click="trashSession">
        <span class="icon trash"></span>
        <span class="label">
          {{ $t("quick_session.restore.trash_button") }}
        </span>
      </button>
      <button class="btn secondary" @click="saveSession">
        <span class="icon save"></span>
        <span class="label">
          {{ $t("quick_session.restore.save_button") }}
        </span>
      </button>

      <div class="flex1"></div>
      <button class="btn" @click="setupSession" :disabled="!microphoneWorked">
        <span class="icon apply"></span>
        <span class="label">
          {{ $t("quick_session.restore.continue_button") }}
        </span>
      </button>
    </div>
  </MainContent>
</template>
<script>
import { bus } from "../main.js"

import { customDebug } from "@/tools/customDebug.js"

import { microphoneMixin } from "@/mixins/microphone.js"
import MainContent from "@/components/MainContent.vue"
import CustomSelect from "@/components/CustomSelect.vue"
import StatusLed from "@/components/StatusLed.vue"
export default {
  mixins: [microphoneMixin],
  props: {
    recover: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      waitingPermission: true,
      error: null,
      optionsDeviceList: {},
      selectedDeviceId: "default",
      microphoneWorked: false,
      audioDevices: null,
    }
  },
  mounted() {
    this.getDeviceList()
  },
  computed: {
    selectedMicroName() {
      return this.optionsDeviceList["devices"].find(
        (device) => device.value == this.selectedDeviceId,
      ).text
    },
  },
  watch: {
    async selectedDeviceId() {
      await this.$nextTick()
      this.connectToMicrophone(this.selectedDeviceId)
    },
  },
  methods: {
    async close() {
      await this.mic.stop()
      await this.vad.stop()
      await this.downSampler.stop()
    },
    setupSession() {
      this.$emit("start-session", {
        source: "microphone",
        deviceId: this.selectedDeviceId,
      })
    },
    trashSession() {
      this.$emit("trash-session")
    },
    saveSession() {
      this.$emit("save-session")
    },
    async backToStart() {
      this.$emit("back")
    },
    async getDeviceList() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        const devices = await navigator.mediaDevices.enumerateDevices()
        this.audioDevices = [...devices.filter((d) => d.kind == "audioinput")]
        this.waitingPermission = false
        this.computeSelectOptionFromDeviceList()
        this.connectToMicrophone(this.selectedDeviceId)
      } catch (error) {
        this.error = error
        console.error(error)
        this.waitingPermission = false
      }
    },
    computeSelectOptionFromDeviceList() {
      let res = []
      if (this.audioDevices) {
        res = this.audioDevices.map((d) => ({
          text: d.label,
          value: d.deviceId,
        }))
      }
      this.optionsDeviceList = {
        devices: [
          {
            text: this.$t(
              "quick_session.setup_microphone.microphone_default_value",
            ),
            value: "default",
          },
          ...res,
        ],
      }
    },
    onVadEvent(speaking) {
      this.microphoneWorked = this.microphoneWorked || speaking
    },
  },
  components: {
    MainContent,
    CustomSelect,
    StatusLed,
  },
}
</script>
