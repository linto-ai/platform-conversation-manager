<template>
  <div
    v-if="!noPlayer"
    id="conversation-audio-player"
    class="conversation-audio-player--subtitle">
    <div
      id="player-waveform-container"
      class="flex col flex1 fullwidth relative">
      <Loading :background="true" v-if="!regionsReady"></Loading>
      <div id="subtitle-player"></div>
    </div>
    <AppPlayerHeader
      :playerError="playerError"
      :currentTime="currentTimeHMS"
      :duration="durationHMS"
      :state="state"
      @playPause="playPause">
      <div class="flex flex1 justify-end align-center gap-small">
        <input
          id="player-seekbar"
          type="range"
          min="0"
          :max="duration"
          v-model="currentTime"
          @input="seekFromBar" />
      </div>
    </AppPlayerHeader>
  </div>
</template>
<script>
import Vue, { h } from "vue"
import WaveSurfer from "wavesurfer.js"
import RegionsPlugin from "../../node_modules/wavesurfer.js/dist/plugins/regions.js"
import TimelinePlugin from "../../node_modules/wavesurfer.js/dist/plugins/timeline.js"

import { bus } from "../main.js"
import { playerMixin } from "@/mixins/player.js"
import { ScreenList } from "../models/screenList"
import { timeToHMS } from "../tools/timeToHMS"

import AppPlayerHeader from "@/components/AppPlayerHeader.vue"
import Loading from "@/components/Loading.vue"

export default {
  mixins: [playerMixin],
  props: {
    blocks: {
      type: ScreenList,
      required: true,
    },
    canEdit: {
      type: Boolean,
      required: true,
    },
    useVideo: {
      type: HTMLVideoElement,
      default: null,
    },
  },
  data() {
    return {
      blocksSettings: new Map(),
    }
  },
  async mounted() {
    await this.initAudioPlayer()
    bus.$on("refresh_screen", (data) => {
      let region = this.getRegion(data.screenId)
      console.log(region)
      this.refreshRegion(region, this.formatScreen(data.changes))
    })
    bus.$on("player_set_time", (data) => {
      if (!this.instanceDestroyed) {
        this.seekTo(data.stime + 0.001)
      }
    })
    bus.$on("add_screen", (data) => {
      this.addScreen(data.newScreen)
    })
    bus.$on("merge_screen", (data) => {
      let { screenId, deletedId } = data
      this.deleteScreen(deletedId)
      let target = this.blocks.get(screenId)

      this.deleteScreen(screenId)
      this.addScreen(target.screen)
    })
    bus.$on("delete_screen", (data) => {
      this.deleteScreen(data.screenId)
    })
  },
  beforeDestroy() {
    bus.$off("refresh_screen")
    bus.$off("player_set_time")
    bus.$off("add_screen")
    bus.$off("merge_screen")
    bus.$off("delete_screen")
  },
  methods: {
    seekFromBar(e) {
      this.seekTo(e.target.value)
    },
    formatScreen(keyValuePair) {
      let res = {}
      for (const [key, value] of Object.entries(keyValuePair)) {
        if (key === "stime") {
          res.start = value
        } else if (key === "etime") {
          res.end = value
        } else {
          res[key] = value
        }
      }
      return res
    },
    getRegion(screenId) {
      return this.regionsPlugin
        .getRegions()
        .find((region) => region.id === screenId)
    },
    destroy() {
      if (this.playerLoading) {
        this.fetchController.abort()
      }
      this?.player?.unAll()
      this?.player?.destroy()
      this.player = null
      URL.revokeObjectURL(this.audioFile)
    },
    async initAudioPlayer() {
      try {
        if (!this.useVideo) {
          await this.getAudioFile()
          if (!this.audioFile) {
            this.noPlayer = true
            throw "Audio is empty"
          }
        }
        // await this.getAudiowaveform() audio waveform is now only generated front-end side
        this.player = WaveSurfer.create({
          url: this.useVideo ? undefined : this.audioFile,
          media: this.useVideo ? this.useVideo : undefined,
          peaks: this.audiowaveform.length > 0 ? this.audiowaveform : null,
          height: 70,
          container: "#subtitle-player",
          cursorColor: "red",
          responsive: true,
          normalize: true,
          plugins: [
            RegionsPlugin.create(),
            TimelinePlugin.create({
              formatTimeCallback: (seconds, pxPerSec) => {
                return timeToHMS(seconds)
              },
              primaryLabelInterval: 2,
            }),
          ],
          backend: "MediaElement",
          fetchParams: this.fetchController.signal,
        })

        this.player.on("loading", () => {
          this.playerLoading = true
        })

        this.player.on("ready", () => {
          this.playerReady = true
          this.playerLoading = false
          this.duration = this.player.getDuration()
        })
        this.player.once("decode", () => {
          this.player.zoom(130)
          setTimeout(this.initBlocks, 1)
          this.regionsReady = true
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
        })

        this.player.on("timeupdate", (time) => {
          this.currentTime = time
          bus.$emit("player-audioprocess", time)
        })
        this.regionsPlugin.on("region-clicked", (region, e) => {
          e.stopPropagation()
          this.seekTo(region.start)
        })
        this.regionsPlugin.on("region-updated", (region) => {
          const screenId = region.id
          const currentBlock = this.blocks.get(screenId)
          const current = this.blocksSettings.get(screenId)
          let drag = region.start != current.start && region.end != current.end
          current.start = region.start
          current.end = region.end
          if (currentBlock.prev) {
            const prev = this.blocksSettings.get(currentBlock.prev)
            if (current.start < prev.end) {
              if (drag) {
                current.end += prev.end - current.start + 0.01
              }
              current.start = prev.end + 0.01
            }
          }

          if (currentBlock.next) {
            const next = this.blocksSettings.get(currentBlock.next)
            if (current.end > next.start) {
              if (drag) {
                current.start -= current.end - next.start + 0.01
              }
              current.end = next.start - 0.01
            }
          }
          current.start = Math.round(current.start * 1000) / 1000
          current.end = Math.round(current.end * 1000) / 1000
          let screen = this.blocks.get(screenId).screen
          if (screen.stime !== current.start || screen.etime !== current.end) {
            this.$emit("blockUpdate", screenId, current.start, current.end)
          }
          this.refreshRegion(region, {
            start: current.start,
            end: current.end,
          })
        })
        this.regionsPlugin.on("region-in", (region) => {
          region.element.part.add("playing")
          bus.$emit("screen-enter", region.id)
        })
        this.regionsPlugin.on("region-out", (region) => {
          region.element?.part?.remove("playing")
          bus.$emit("screen-leave", region.id)
        })
      } catch (error) {
        console.log(error)
        this.playerError = true
      }
    },
    createRegionContent(time) {
      // Custom content in each region
    },
    createRegion(screen) {
      let ms = Math.floor((screen.stime - Math.floor(screen.stime)) * 100)
      let time = timeToHMS(screen.stime, { stripZeros: true }) + "." + ms
      let content = this.createRegionContent(time)
      return {
        id: screen.screen_id,
        start: screen.stime,
        end: screen.etime,
        minLength: Math.min(1, screen.etime - screen.stime),
        content: content,
        resize: this.canEdit,
        drag: this.canEdit,
        color: "#FFF",
      }
    },
    initBlocks() {
      this.blocksSettings.clear()
      for (let screen of this.blocks) {
        let block = screen.screen
        let region = this.createRegion(block)
        this.blocksSettings.set(block.screen_id, region)
      }
      this.updateBlocks()
    },
    updateBlocks() {
      this.regionsPlugin.clearRegions()
      for (let [_, region] of this.blocksSettings) {
        this.regionsPlugin.addRegion(region)
      }
    },
    deleteScreen(screenId) {
      console.log(screenId)
      let region = this.getRegion(screenId)
      this.blocksSettings.delete(screenId)
      region.remove()
    },
    addScreen(screen) {
      let region = this.createRegion(screen)
      this.blocksSettings.set(screen.screen_id, region)
      this.regionsPlugin.addRegion(region)
    },
    refreshRegion(region, changes) {
      let screen = this.blocksSettings.get(region.id)
      for (const [key, value] of Object.entries(changes)) {
        region[key] = value
        screen[key] = value
      }
      let ms = Math.floor((screen.start - Math.floor(screen.start)) * 100)
      let time = timeToHMS(screen.start, { stripZeros: true }) + "." + ms
      let content = this.createRegionContent(time)
      screen.content = content
      region.setContent(content)
      region.renderPosition()
    },
  },
  components: {
    Loading,
    AppPlayerHeader,
  },
}
</script>
