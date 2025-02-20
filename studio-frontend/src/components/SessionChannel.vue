<template>
  <Loading v-if="loading" />
  <div class="flex col flex1 reset-overflows" v-else>
    <div
      class="session-content__action-bar flex align-center gap-medium"
      v-if="this.selectedTurns.length > 0">
      <button class="red-border" @click="clearSelectedTurns">
        <span class="label">{{
          $tc("session.detail_page.clear_turn_selection")
        }}</span>
      </button>

      <button @click="copyTurns">
        <span class="icon apply" v-if="copyState"></span>
        <span class="icon copy" v-else></span>
        <span class="label">{{
          $tc("session.detail_page.copy_turns_text")
        }}</span>
      </button>
      <span>{{
        $tc("session.detail_page.n_turns_selected", this.selectedTurns.length)
      }}</span>
    </div>

    <div
      v-if="hasText"
      class="flex col flex1 session-content__turns reset-overflows"
      :class="{ has_subtitles: displaySubtitles }">
      <SessionChannelTurn
        v-for="turn in previousTurns"
        v-if="displayLiveTranscription && shouldDisplayTurn(turn)"
        :key="turn.uuid"
        :selectedTranslations="selectedTranslations"
        :turn="turn"
        :selected="selectedTurns.includes(turn.uuid)"
        @select="onSelectTurn(turn.uuid, $event)"></SessionChannelTurn>

      <SessionChannelTurn
        v-for="turn in turns"
        v-if="displayLiveTranscription && shouldDisplayTurn(turn)"
        :key="turn.uuid"
        :selectedTranslations="selectedTranslations"
        :turn="turn"
        :selected="selectedTurns.includes(turn.uuid)"
        @select="onSelectTurn(turn.uuid, $event)"></SessionChannelTurn>

      <SessionChannelTurnPartial
        v-if="displayLiveTranscription && partialText !== ''"
        ref="partial"
        :selectedTranslations="selectedTranslations"
        :partialObject="partialObject"
        :partialText="partialText"></SessionChannelTurnPartial>

      <div ref="bottom"></div>
    </div>
    <div
      v-else
      class="flex align-center justify-center flex1 col center-text gap-medium">
      <h2>{{ $t("session.detail_page.no_transcription") }}</h2>
      <Svglogo style="max-height: 6rem; margin: 2rem" />
      <div ref="bottom"></div>
    </div>

    <!-- Subtitles -->
    <SessionSubtitle
      v-if="displaySubtitles"
      class="session-content__subtitle"
      :previousTurns="previousTurns"
      :partialText="partialText"
      :finalText="finalText"
      :fontSize="fontSize"
      :key="fontSize"
      :selectedTranslations="selectedTranslations" />

    <!-- <div
      class="session-content__subtitle"
      :style="style"
      ref="subtitle"
      v-if="displaySubtitles">
      <div id="scroller">
        <div v-for="turn of lastTwoTurns">
          {{ turn.text }}
        </div>
        <div>{{ partialText }}</div>
        <div ref="subtitle-bottom"></div>
      </div>
    </div> -->

    <button
      v-if="!isBottom"
      @click="scrollToBottom(true)"
      class="bottom-session-button"
      :class="{ has_subtitles: displaySubtitles }">
      <span class="icon bottom-arrow"></span>
    </button>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import { sessionChannelModelMixin } from "../mixins/sessionChannelModel.js"

import {
  apiGetSessionChannel,
  apiGetPublicSessionChannel,
} from "@/api/session.js"

import SessionChannelTurn from "@/components/SessionChannelTurn.vue"
import SessionChannelTurnPartial from "@/components/SessionChannelTurnPartial.vue"
import Svglogo from "@/svg/Microphone.vue"
import SessionSubtitle from "@/components/SessionSubtitle.vue"
import Loading from "@/components/Loading.vue"
import uuidv4 from "uuid/v4.js"

import getTextTurnWithTranslation from "@/tools/getTextTurnWithTranslation.js"

export default {
  mixins: [sessionChannelModelMixin],
  props: {
    channel: {
      type: Object,
      required: true,
    },
    fontSize: {
      type: String,
      default: "40",
    },
    displaySubtitles: {
      type: Boolean,
      default: true,
    },
    displayLiveTranscription: {
      type: Boolean,
      default: true,
    },
    organizationId: {
      type: String,
      required: false,
    },
    sessionId: {
      type: String,
      required: true,
    },
    isBottom: {
      type: Boolean,
      default: false,
    },
    selectedTranslations: {
      type: String,
      required: false,
      default: "original",
    },
  },
  data() {
    return {
      turns: [],
      previousTurns: [],
      partialText: "",
      partialObject: {},
      finalText: "",
      finalObject: {},
      loading: true,
      selectedTurns: [],
      copyState: false,
    }
  },
  mounted() {
    // add uuid to the channel
    // this.previousTurns = (this.channel?.closedCaptions || []).map((turn) => {
    //   return {
    //     ...turn,
    //     uuid: uuidv4(),
    //   }
    // })
    this.loading = false
    this.init()

    document.addEventListener("keydown", this.keydown)
  },
  beforeDestroy() {
    this.$sessionWS.unSubscribeRoom()
    document.removeEventListener("keydown", this.keydown)
  },
  computed: {
    channelIndex() {
      return this.channelId
    },
    lastTwoTurns() {
      return this.turns.slice(-2)
    },
    style() {
      return {
        fontSize: this.fontSize + "px",
        lineHeight: this.fontSize * 1.3 + "px",
      }
    },
    hasText() {
      return (
        this.turns.length > 0 ||
        this.previousTurns.length > 0 ||
        this.partialText !== ""
      )
    },
  },
  watch: {
    channel: {
      async handler() {
        this.loading = true
        this.init()
        await this.loadPreviousTranscrition()
        this.loading = false
        this.scrollToBottom()
        this.clearSelectedTurns()
      },
      deep: true,
      immediate: true,
    },
    displaySubtitles() {
      this.scrollToBottom(true)
    },
    "$sessionWS.state.isConnected"(newValue, oldValue) {
      if (newValue) {
        this.subscribeToWebsocket()
      }
    },
  },
  methods: {
    init() {
      this.partialText = ""
      this.turns = []
      if (this.$sessionWS.state.isConnected) {
        this.subscribeToWebsocket()
      }
      setTimeout(() => {
        this.scrollToBottom(true)
      }, 1000)
    },
    subscribeToWebsocket() {
      this.$sessionWS.subscribeRoom(
        this.sessionId,
        this.channelIndex,
        this.onPartial.bind(this),
        this.onFinal.bind(this),
      )
    },
    shouldDisplayTurn(turn) {
      const hasSpeaker = !!turn.locutor
      if (
        this.hasDiarization &&
        this.selectedTranslations === "original" &&
        hasSpeaker
      ) {
        return true
      }

      if (this.selectedTranslations !== "original" && !hasSpeaker) {
        return true
      }

      if (!this.hasDiarization && !hasSpeaker) {
        return true
      }

      return false
    },
    async loadPreviousTranscrition() {
      let sessionRequest = null

      if (this.organizationId) {
        sessionRequest = await apiGetSessionChannel(
          this.organizationId,
          this.sessionId,
          this.channelIndex,
        )
      }

      if (!sessionRequest || sessionRequest.status === "error") {
        sessionRequest = await apiGetPublicSessionChannel(
          this.sessionId,
          this.channel.transcriber_id,
        )
      }

      // filter out the channel we are interested in

      const allChannels = sessionRequest?.data?.channels

      if (!allChannels) {
        this.previousTurns = []
      } else {
        const channel = allChannels.find(
          (channel) => channel.id === this.channelIndex,
        )
        // add uuid to the channel
        this.previousTurns = (channel?.closedCaptions || []).map((turn) => {
          return {
            ...turn,
            uuid: uuidv4(),
          }
        })
      }
    },
    onPartial(content) {
      this.partialText = getTextTurnWithTranslation(
        content,
        this.selectedTranslations,
      )
      this.partialObject = content
      this.scrollToBottom()
    },
    onFinal(content) {
      content.uuid = uuidv4()

      this.partialText = ""

      this.finalText = getTextTurnWithTranslation(
        content,
        this.selectedTranslations,
      )
      this.finalObject = content
      this.turns.push(content)
      this.scrollToBottom()
    },
    scrollToBottom(force = false) {
      if (!this.displayLiveTranscription) return
      if (!this.hasText) return
      if (!this.isBottom && !force) return

      this.$nextTick().then(() => {
        if (this.$refs.bottom) {
          this.$refs.bottom.scrollIntoView({ behavior: "smooth" })
        }
      })
    },
    clearSelection() {
      if (document.selection && document.selection.empty) {
        document.selection.empty()
      } else if (window.getSelection) {
        var sel = window.getSelection()
        sel.removeAllRanges()
      }
    },
    onSelectTurn(turnId, event) {
      event.stopPropagation()
      event.preventDefault()
      if (event.ctrlKey) {
        if (this.selectedTurns.includes(turnId)) {
          this.selectedTurns = this.selectedTurns.filter((id) => id !== turnId)
        } else {
          this.selectedTurns.push(turnId)
        }

        return
      }

      if (event.shiftKey) {
        this.clearSelection()
        const allturns = this.previousTurns.concat(this.turns)
        const clickedIndex = allturns.findIndex((turn) => turn.uuid === turnId)
        const firstSelectedIndex = allturns.findIndex(
          (turn) => turn.uuid === this.selectedTurns[0],
        )
        const lastSelectedIndex = allturns.findIndex(
          (turn) =>
            turn.uuid === this.selectedTurns[this.selectedTurns.length - 1],
        )

        if (clickedIndex < firstSelectedIndex) {
          this.selectedTurns = allturns
            .slice(clickedIndex, firstSelectedIndex + 1)
            .map((turn) => turn.uuid)
        }

        if (clickedIndex > lastSelectedIndex) {
          this.selectedTurns = allturns
            .slice(lastSelectedIndex, clickedIndex + 1)
            .map((turn) => turn.uuid)
        }

        return
      }

      this.selectedTurns = [turnId]
    },
    copyTurns() {
      const selectedTurns = this.turns.filter((turn) =>
        this.selectedTurns.includes(turn.uuid),
      )
      const previousSelectedTurns = this.previousTurns.filter((turn) =>
        this.selectedTurns.includes(turn.uuid),
      )

      const text = previousSelectedTurns
        .concat(selectedTurns)
        .map((turn) =>
          getTextTurnWithTranslation(turn, this.selectedTranslations),
        )
        .join("\n\n")

      this.copyState = true
      setTimeout(() => {
        this.copyState = false
      }, 1000)
      navigator.clipboard.writeText(text)
    },
    clearSelectedTurns() {
      // TODO: clear selection when clicking on the background
      this.selectedTurns = []
    },
    keydown(e) {
      if (e.key === "Escape") {
        this.clearSelectedTurns()
      }

      if (e.key === "c" && e.ctrlKey) {
        this.copyTurns()
      }
    },
  },
  components: {
    Fragment,
    SessionChannelTurn,
    SessionChannelTurnPartial,
    Svglogo,
    SessionSubtitle,
    Loading,
  },
}
</script>
