<template>
  <div id="conversation-audio-player" class="flex col" v-if="!noPlayer">
    <AppPlayerHeader
      :playerError="playerError"
      :currentTime="currentTimeHMS"
      :duration="durationHMS"
      :state="state"
      @playPause="playPause">
      <slot></slot>
    </AppPlayerHeader>
    <div
      id="plater-waveform-container"
      class="flex col flex1 fullwidth relative">
      <Loading :background="true" v-if="!regionsReady"></Loading>
      <div id="waveform" style="min-width: 300px; height: 40px"></div>
      <div id="waveform-timeline" style="min-width: 300px; height: 20px"></div>
    </div>
  </div>
  <div id="conversation-audio-player" v-else>
    <slot></slot>
  </div>
</template>
<script>
import { bus } from "../main.js"
import { convertHexToRGBA } from "../tools/convertHexToRGBA.js"
import { timeToHMS } from "../tools/timeToHMS.js"
import { playerMixin } from "@/mixins/player.js"
import WaveSurfer from "wavesurfer.js"
import RegionsPlugin from "../../node_modules/wavesurfer.js/dist/plugins/regions.js"
import TimelinePlugin from "../../node_modules/wavesurfer.js/dist/plugins/timeline.js"
import Loading from "@/components/Loading.vue"
import AppPlayerHeader from "@/components/AppPlayerHeader.vue"
export default {
  mixins: [playerMixin],
  props: {
    speakers: {
      type: Array,
      required: true,
    },
    speakersTurnsTimebox: {
      type: Array,
      required: true,
    },
    filterSpeakers: {
      required: true,
    },
  },
  data() {
    return {
      playerSettings: null,
      regionsSettings: [],
      audioProcessClean: true,
      currentPlaylist: {},
      regionZoom: 1,
    }
  },
  async mounted() {
    await this.initAudioPlayer()
    bus.$on("refresh_audio_regions", (data) => {
      if (!this.instanceDestroyed) {
        this.updateRegions(data)
      }
    })
    bus.$on("player_set_time", (data) => {
      if (!this.instanceDestroyed) {
        this.seekTo(data.stime)
        if (this.conversationFiltered) {
          let currentTimeBox = this.speakersTurnsTimebox.find((turn) => {
            return turn.stime <= data.stime && turn.etime >= data.stime
          })
          if (currentTimeBox) {
            this.currentPlaylist = {
              stime: currentTimeBox.stime,
              etime: currentTimeBox.etime,
            }
          }
        }
      }
    })

    bus.$on("player-play", () => {
      if (this.player) {
        this.player.play()
      }
    })

    bus.$on("player-pause", () => {
      if (this.player) {
        this.player.pause()
      }
    })
  },
  beforeDestroy() {
    bus.$off("refresh_audio_regions")
    bus.$off("player_set_time")
    bus.$off("player-play")
    bus.$off("player-pause")
  },
  computed: {
    currentTurn() {
      if (this.speakersTurnsTimebox.length > 0) {
        for (let turn of this.speakersTurnsTimebox) {
          if (
            turn.stime <= this.currentTime &&
            turn.etime >= this.currentTime
          ) {
            return turn
          }
        }
      }
      return false
    },
    conversationFiltered() {
      return this.filterSpeakers !== "default"
    },
  },
  watch: {
    speakersTurnsTimebox(data) {
      if (this.player && this.playerReady) {
        this.updateRegions(data)
      }
    },
    filterSpeakers() {
      this.currentPlaylist = {
        stime: this.speakersTurnsTimebox[0].stime,
        etime: this.speakersTurnsTimebox[0].etime,
      }
      this.seekTo(this.currentPlaylist.stime)
    },
  },
  methods: {
    destroy() {
      document.removeEventListener("keydown", this.keyboardHandler)
      if (this.playerLoading) {
        this.fetchController.abort() // Cancel the audio file loading process.
      }
      this?.player?.unAll()
      this?.player?.destroy()
      this.player = null
      URL.revokeObjectURL(this.audioFile)
    },
    renderFunction(channels, ctx) {
      const { width, height } = ctx.canvas
      const scale = channels[0].length / width
      const step = 0.5

      ctx.translate(0, height / 2)
      ctx.strokeStyle = ctx.fillStyle
      ctx.beginPath()

      for (let i = 0; i < width; i += step * 2) {
        const index = Math.floor(i * scale)
        const value = Math.abs(channels[0][index])
        let x = i
        let y = value * (height / 2)

        ctx.moveTo(x, 0)
        ctx.lineTo(x, y)
        ctx.lineTo(x + step, 0)

        x = x + step
        y = -y
        ctx.moveTo(x, 0)
        ctx.lineTo(x, y)
        ctx.lineTo(x + step, 0)
      }

      ctx.stroke()
      ctx.closePath()
    },
    async initAudioPlayer() {
      try {
        await this.getAudioFile()

        if (!this.audioFile) {
          this.noPlayer = true
          throw "Audio is empty"
        }
        // await this.getAudiowaveform() audio waveform is now only generated front-end side
        this.player = WaveSurfer.create({
          container: "#waveform",
          waveColor: "#000",
          progressColor: "#FFF",
          height: 40,
          barRadius: 0,
          barWidth: 0.1,
          cursorWidth: 1,
          cursorColor: "red",
          minPxPerSec: 0,
          normalize: true,
          plugins: [
            RegionsPlugin.create(),
            TimelinePlugin.create({
              container: "#waveform-timeline",
            }),
          ],
          backend: "MediaElement",
          fetchParams: this.fetchController.signal,
          renderFunction: this.renderFunction,
        })
        if (this.audiowaveform.length > 0) {
          this.player.load(this.audioFile, this.audiowaveform)
        } else this.player.load(this.audioFile)

        this.player.on("loading", () => {
          this.playerLoading = true
        })

        this.player.on("ready", () => {
          this.playerReady = true
          this.playerLoading = false
          this.duration = this.player.getDuration()
          bus.$emit("player-ready")
        })
        this.player.once("decode", () => {
          //if (!this.player) return
          this.initRegions()
          this.regionsReady = true
          if (this.regionsPlugin?.regions?.length > 0) {
            this.regionsPlugin.regionsContainer.style.zIndex = "0"
            for (let region of this.regionsPlugin.regions) {
              let time = `(${timeToHMS(region.start)} - ${timeToHMS(
                region.end,
              )})`
              let name = this.speakersTurnsTimebox.find(
                (e) => e.turn_id == region.id,
              )
              region.element.title = `${name.speakerName} ${time}`
            }
          }
        })
        this.player.on("play", () => {
          this.state = "playing"
        })
        this.player.on("pause", () => {
          this.state = "pause"
        })
        this.player.on("seeking", (time) => {
          this.currentTime = time
          bus.$emit("player-seek", this.currentTime)
          if (this.conversationFiltered) {
            if (
              this.currentTime > this.currentPlaylist.etime ||
              this.currentTime < this.currentPlaylist.stime
            ) {
              this.updatePlaylist(currentTime, false, this.player.isPlaying())
            }
          }
        })

        this.player.on("timeupdate", (time) => {
          bus.$emit("player-audioprocess", time)
          this.currentTime = time
          if (
            this.currentPlaylist.etime !== undefined &&
            this.currentPlaylist.stime !== undefined
          ) {
            if (
              this.conversationFiltered &&
              (time > this.currentPlaylist.etime ||
                time < this.currentPlaylist.stime) &&
              this.audioProcessClean
            ) {
              this.player.pause()
              this.audioProcessClean = false
              this.updatePlaylist(time, true, true)
            }
          }
        })

        this.keyboardHandler = this.keyboardListener.bind(this)
        document.addEventListener("keydown", this.keyboardHandler)
      } catch (error) {
        console.error(error)
        this.destroy()
        this.playerError = true
        return
      }
    },
    updatePlaylist(time, seek, isPlaying) {
      let targetTimebox = null
      if (
        time > this.currentPlaylist.etime ||
        time < this.currentPlaylist.stime
      ) {
        targetTimebox = this.speakersTurnsTimebox.find((turn) => {
          return turn.etime >= time
        })
      }
      if (targetTimebox) {
        this.currentPlaylist = {
          stime: targetTimebox.stime,
          etime: targetTimebox.etime,
        }
        this.audioProcessClean = true
        if (isPlaying) {
          if (this.currentPlaylist.stime < time) {
            setTimeout(() => {
              this.player.play(time + 0.01)
            }, 500)
          } else {
            setTimeout(() => {
              this.player.play(this.currentPlaylist.stime + 0.01)
            }, 500)
          }
        } else {
          if (this.currentPlaylist.stime < time) {
            this.seekTo(time + 0.01)
          } else {
            this.seekTo(this.currentPlaylist.stime + 0.01)
          }
        }
      } else {
        if (seek) {
          this.seekTo(this.speakersTurnsTimebox[0].stime)
        }
        this.audioProcessClean = true
      }
    },
    initRegions() {
      this.regionsSettings = []
      for (let timeItem of this.speakersTurnsTimebox) {
        let region = {
          start: timeItem.stime,
          end: timeItem.etime,
          resize: false,
          drag: false,
          color: convertHexToRGBA(timeItem.color, 0.5),
          id: timeItem.turn_id,
        }
        this.regionsSettings.push(region)
      }
      this.regionsPlugin.clearRegions()
      for (let reg of this.regionsSettings) {
        this.regionsPlugin.addRegion(reg)
      }
    },
    updateRegions(data) {
      this.regionsSettings = []
      for (let timeItem of data) {
        let region = {
          start: timeItem.stime,
          end: timeItem.etime,
          resize: false,
          drag: false,
          color: convertHexToRGBA(timeItem.color, 0.5),
          id: timeItem.speakerName,
        }
        this.regionsSettings.push(region)
      }
      this.regionsPlugin.clearRegions()
      for (let reg of this.regionsSettings) {
        this.regionsPlugin.addRegion(reg)
      }
    },
    keyboardListener(event) {
      switch (event.code) {
        case "Space":
          event.preventDefault()
          this.playPause()
          break
        case "ArrowRight":
          if (event.shiftKey) {
            this.forwardTime(3)
            event.preventDefault()
          } else if (event.altKey) {
            this.forwardTime(10)
            event.preventDefault()
          } else if (event.ctrlKey) {
            this.forwardTime(60)
            event.preventDefault()
          }
          break
        case "ArrowLeft":
          if (event.shiftKey) {
            this.forwardTime(-3)
            event.preventDefault()
          } else if (event.altKey) {
            this.forwardTime(-10)
            event.preventDefault()
          } else if (event.ctrlKey) {
            this.forwardTime(-60)
            event.preventDefault()
          }
          break
        default:
          break
      }
    },
    forwardTime(numberOfSecond) {
      this.player.skip(numberOfSecond)
    },
    zoomTimeline(value) {
      this.player.zoom(value)
    },
  },
  components: {
    Loading,
    AppPlayerHeader,
  },
}
</script>
