<template>
  <div id="video-player" class="flex1">
    <div class="video-container">
      <div class="video-content flex justify-center">
        <div id="video" class="flex justify-center">
          <video
            v-if="videoLoaded"
            ref="video-preview"
            id="video-preview"
            controls
            :src="videoUrl"></video>
          <img v-else src="/img/subtitle_default.svg" alt="" />
          <div
            class="screen-container flex col justify-center"
            ref="screen-container"></div>
        </div>
      </div>
    </div>
    <div class="flex col overlay" v-if="!videoLoaded">
      <Droparea
        :accepts="['video/*']"
        :check-file-validity="checkFileValidity"
        @drop="handleDrop($event)"
        @error="handleError($event)">
        <div>{{ $t("conversation.subtitles.drop_video") }}</div>
      </Droparea>
    </div>
  </div>
</template>
<script>
import Droparea from "./Droparea.vue"
import { bus } from "../main.js"

export default {
  props: {
    audioDuration: {
      type: Number,
      required: true,
    },
    screens: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      videoLoaded: false,
      videoUrl: "",
      videoElem: null,
      currentScreenId: "",
    }
  },
  watch: {
    videoLoaded(val) {
      if (val) {
        this.$nextTick(() => {
          this.videoElem = this.$refs["video-preview"]
          this.$emit("videoLoaded", this.videoElem)
        })
      }
    },
  },
  beforeDestroy() {
    if (this.videoLoaded) {
      URL.revokeObjectURL(this.videoUrl)
    }
  },
  mounted() {
    bus.$on("screen-enter", this.handleScreenEnter)
    bus.$on("screen-leave", this.handleScreenLeave)
  },
  beforeDestroy() {
    bus.$off("screen-enter", this.handleScreenEnter)
    bus.$off("screen-leave", this.handleScreenLeave)
  },
  methods: {
    handleScreenEnter(screen_id) {
      const screen = this.screens[screen_id].screen
      let elem = this.$refs["screen-container"]
      elem.innerHTML = ""
      for (let line of screen.text) {
        let lineElem = document.createElement("div")
        lineElem.classList.add("screen-line")
        lineElem.innerText = line
        elem.append(lineElem)
      }
      this.currentScreenId = screen_id
    },
    handleScreenLeave(screen_id) {
      if (this.currentScreenId === screen_id) {
        this.$refs["screen-container"].innerHTML = ""
      }
    },
    handleDrop(files) {
      if (files.length > 0) {
        this.videoLoaded = true
        let elem = this.$refs["screen-container"]
        elem.innerHTML = ""
        this.videoUrl = URL.createObjectURL(files[0])
      }
    },
    handleError(e) {
      bus.$emit("app_notif", {
        status: "error",
        message: e.msg,
        timeout: null,
        redirect: false,
      })
    },
    getFileDuration(file) {
      return new Promise((resolve) => {
        let audio = document.createElement("audio")
        audio.preload = "metadata"
        audio.src = URL.createObjectURL(file)
        audio.addEventListener("loadedmetadata", () => {
          URL.revokeObjectURL(file)
          resolve(audio.duration)
        })
      })
    },
    async checkFileValidity(file) {
      if (file.type.includes("video/")) {
        let duration = Math.floor(await this.getFileDuration(file))
        let requested = Math.floor(this.audioDuration)
        // Allow 10% difference
        return Math.abs(duration - requested) < requested * 0.1
      }
      return false
    },
  },
  components: {
    Droparea,
  },
}
</script>
