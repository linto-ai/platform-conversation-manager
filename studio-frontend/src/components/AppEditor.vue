<template>
  <div class="flex1 flex col">
    <div id="conversation" class="flex1">
      <div id="tanscript-editor-conversation">
        <div v-for="turn in turnPages[currentPageNb]" :key="turn.turn_id">
          <AppEditorTurn
            v-if="turn.words.length > 0"
            :turnData="turn"
            :speakers="speakers"
            :index="turns.findIndex((turn) => turn.turn_id === turn.turn_id)"
            :usersConnected="usersConnected"
            :focusFields="focusFields"
            :conversationId="conversationId"
            :conversationUsers="conversationUsers"
            :userInfo="userInfo"
            :canEdit="canEdit"
            :conversationIsFiltered="conversationIsFiltered"
            :hightlightsCategories="hightlightsCategories"
            :hightlightsCategoriesVisibility="hightlightsCategoriesVisibility"
            :lastTurn="
              turns.findIndex((t) => t.turn_id === turn.turn_id) ===
              turns.length - 1
            "
            :searchResult="searchResultIndexedByTurn[turn.turn_id]"
            :focusResultId="focusResultId"
            @mergeTurns="mergeTurns"
            @newHighlight="$emit('newHighlight', $event)" />
        </div>
      </div>
    </div>

    <AppEditorPlayer
      :key="audioId"
      :audio="conversation.metadata.audio"
      :speakers="speakers"
      :speakersTurnsTimebox="speakersTurnsTimebox"
      :conversationId="audioId"
      :filterSpeakers="filterSpeakers"
      ref="editorPlayer">
      <AppEditorPagination
        v-model="currentPageNb"
        :pages="pages"></AppEditorPagination>
    </AppEditorPlayer>
  </div>
</template>
<script>
import { bus } from "../main.js"
import uuidv4 from "uuid/v4.js"

import { workerSendMessage } from "@/tools/worker-message.js"
import findExpressionInWordsList from "@/tools/findExpressionInWordsList.js"
import getWordsRangeFromTagMetadata from "@/tools/getWordsRangeFromTagMetadata.js"
import findInSegment from "@/tools/findInSegment.js"

import { debounceMixin } from "../mixins/debounce.js"

import AppEditorTurn from "@/components/AppEditorTurn.vue"
import AppEditorPlayer from "@/components/AppEditorPlayer.vue"
import AppEditorPagination from "@/components/Pagination.vue"
import ModalDeleteTagHighlight from "@/components/ModalDeleteTagHighlight.vue"

export default {
  mixins: [debounceMixin],
  props: {
    canEdit: {
      type: Boolean,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
    conversationUsers: {
      type: Array,
      required: true,
      default: () => [],
    },
    usersConnected: {
      type: Array,
      required: true,
      default: () => [],
    },
    conversation: {
      type: Object,
      required: true,
    },
    rootConversation: {
      type: Object,
      required: true,
    },
    filterSpeakers: {
      required: false,
    },
    turnPages: {
      type: Array,
      required: true,
    },
    turns: {
      type: Array,
      required: true,
    },
    noPlayer: {
      type: Boolean,
      default: false,
    },
    hightlightsCategories: {
      type: Array,
      required: true,
    },
    hightlightsCategoriesVisibility: {
      type: Object,
      required: true,
    },
    focusFields: {
      type: Object,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      pageNumberOfEachWord: this.computePageNumberOfEachWord(this.turnPages),
      //speakers: this.conversation.speakers,
      currentTime: 0,
      spkColors: [
        "#23C4ED",
        "#00AC61",
        "#8D3DAF",
        "#E07C24",
        "#DB0B5F",
        "#1B98F5",
      ],
      speakersTurnsTimebox: [],
      currentPageNb: 0,
      focusResultId: null,
      searchResults: [],
      focusResultIndex: null,
      clickOnTags: {}, // {tagid: number of click}
    }
  },
  computed: {
    conversationId() {
      return this.conversation._id
    },
    rootConversationId() {
      return this.rootConversation._id
    },
    audioId() {
      return this.channelId || this.conversationId
    },
    pages() {
      return this.turnPages.length
    },
    speakers() {
      let speakers = this.conversation.speakers
      let i = 1
      speakers.map((spk) => {
        spk.color = this.spkColors[i % this.spkColors.length]
        i++
      })
      return speakers
    },
    conversationIsFiltered() {
      return this.filterSpeakers != "default"
    },
    keywords() {
      const keywordsTags = []
      const keywordsCat = this.conversation?.keywords || []
      for (let cat of keywordsCat) {
        keywordsTags.push(...cat.tags)
      }
      return keywordsTags
    },
    searchResultIndexedByTurn() {
      let searchResultIndexedByTurn = {}
      for (let result of this.searchResults) {
        if (!searchResultIndexedByTurn[result.turn_id]) {
          searchResultIndexedByTurn[result.turn_id] = []
        }
        searchResultIndexedByTurn[result.turn_id].push(result)
      }
      return searchResultIndexedByTurn
    },
    tags() {
      let res = {}
      const words = this.conversation.text
        .reduce((acc, turn) => acc.concat(turn.words), [])
        .filter((w) => w.word !== "")
      for (let cat of this.hightlightsCategories) {
        for (let tag of cat.tags) {
          let ranges = getWordsRangeFromTagMetadata(tag)
          if (!ranges || ranges.length == 0) {
            ranges = findExpressionInWordsList(
              [tag],
              words,
              (k) => k.name,
              (w) => w.word,
            )

            ranges.forEach((element) => {
              element.startId = words[element.start].wid
              element.endId = words[element.end].wid
            })
          }
          res[tag._id] = {
            ...tag,
            ranges,
          }
        }
      }
      return res
    },
  },
  watch: {
    filterSpeakers() {
      this.speakersTurnsTimebox = this.getSpkTimebox()
    },
  },
  mounted() {
    this.speakersTurnsTimebox = this.getSpkTimebox()
    bus.$on("player-audioprocess", (time) => {
      this.updateCurrentTime(time)
    })
    bus.$on("player-seek", (time) => {
      this.updateCurrentTime(time)
    })

    bus.$on("refresh_spk_timebox", () => {
      this.speakersTurnsTimebox = this.getSpkTimebox()
      bus.$emit("refresh_audio_regions", this.speakersTurnsTimebox)
    })
    bus.$on("player-ready", this.playerReady.bind(this))
  },
  beforeDestroy() {
    bus.$off("player-audioprocess")
    bus.$off("player-seek")
    bus.$off("refresh_spk_timebox")
    bus.$off("player-ready")

    // turns event (should be in this component instead of appeditorturn, because of merge and split which trigger beforeDestroy on appeditorturn)
    bus.$off("conversation_user_update")
    bus.$off("words_updated")
    bus.$off("segment_updated")
    bus.$off("turn_speaker_update")
    bus.$off("speaker_name_updated")
  },
  methods: {
    computePageNumberOfEachWord(turnPages) {
      let pageNumberOfEachWord = {}
      for (let i = 0; i < turnPages.length; i++) {
        for (let turn of turnPages[i]) {
          for (let word of turn.words) {
            pageNumberOfEachWord[word.wid] = i
          }
        }
      }

      return pageNumberOfEachWord
    },
    async goToRange(range) {
      const startId = range.startId
      const pageNumber = this.pageNumberOfEachWord[startId]

      if (pageNumber !== undefined) {
        this.currentPageNb = pageNumber
        //scroll to the id
        await this.$nextTick()
        const element = document.getElementById(startId)
        if (element) {
          element.scrollIntoView({
            block: "center",
          })
        }
      }
    },
    updateFocus() {
      const newIndex = this.focusResultIndex
      if (newIndex === null) {
        this.focusResultId = null
      } else {
        //this.currentPageNb = this.searchResults[newIndex].page
        this.focusResultId = this.searchResults[newIndex].id

        this.goToRange(this.searchResults[newIndex])
      }
      this.$emit("updateSelectedResult", newIndex)
    },
    resetSearchResult() {
      this.searchResultExpression = {}
      this.focusResultId = null
      this.searchResultId = []
    },
    async searchInTranscription(search, exactMatching = false) {
      this.resetSearchResult()
      this.searchResults = await this.debouncedSearch(
        this.searchInTranscriptionLocal.bind(this),
        { search, exactMatching },
      )
      this.$emit("foundExpression", this.searchResults.length)
      this.selectFirstResult()
    },
    searchInTranscriptionLocal({ search, exactMatching }) {
      if (search.trim() === "") {
        return []
      }
      let results = []
      for (
        let localCurrentPageNb = 0;
        localCurrentPageNb < this.pages;
        localCurrentPageNb++
      ) {
        for (const turn of this.turnPages[localCurrentPageNb]) {
          let wordsList = turn.words.filter((w) => w.word !== "")

          let found = []
          if (!exactMatching) {
            found = findInSegment(
              wordsList.map((w) => w.word),
              search,
            )
          } else {
            found = findExpressionInWordsList(
              [search],
              wordsList.map((w) => w.word),
              null,
              null,
            )
          }

          found.map((f) => {
            f.id = uuidv4()
            f.turn_id = turn.turn_id
            f.page = localCurrentPageNb
            f.startId = wordsList[f.start].wid
            f.endId = wordsList[f.end].wid
          })

          results = results.concat(found)
        }
      }
      return results
    },
    selectFirstResult() {
      if (this.searchResults.length === 0) {
        this.focusResultIndex = null
        this.focusResultId = null
        return
      }
      this.focusResultIndex = 0
      this.updateFocus()
    },
    nextResultFound() {
      if (this.focusResultIndex >= this.searchResults.length - 1) {
        this.focusResultIndex = 0
      } else {
        this.focusResultIndex++
      }
      this.updateFocus()
    },
    previousResultFound() {
      if (this.focusResultIndex <= 0) {
        this.focusResultIndex = this.searchResults.length - 1
      } else {
        this.focusResultIndex--
      }
      this.updateFocus()
    },
    playerReady() {
      let editorCurrentTime = localStorage.getItem("editorCurrentTime")
      if (editorCurrentTime) {
        editorCurrentTime = JSON.parse(editorCurrentTime)
        if (editorCurrentTime.conversationId === this.conversationId) {
          bus.$emit("player_set_time", { stime: editorCurrentTime.time })
        }
      }
    },
    getSpkTimebox() {
      let spkTimebox = []
      for (let turn of this.turns) {
        if (turn.stime && turn.etime) {
          let spk = this.speakers.find(
            (spk) => spk.speaker_id === turn.speaker_id,
          )
          if (spk) {
            let item = {
              turn_id: turn.turn_id,
              speakerId: turn.speaker_id,
              speakerName: spk.speaker_name,
              stime: turn.stime,
              etime: turn.etime,
              color: spk.color,
            }
            spkTimebox.push(item)
          }
        } else if (turn.words.length > 0) {
          let spk = this.speakers.find(
            (spk) => spk.speaker_id === turn.speaker_id,
          )
          if (spk) {
            let item = {
              turn_id: turn.turn_id,
              speakerId: turn.speaker_id,
              speakerName: spk.speaker_name,
              stime: turn.words[0].stime,
              etime: turn.words[turn.words.length - 1].etime,
              color: spk.color,
            }
            spkTimebox.push(item)
          }
        }
      }
      return spkTimebox
    },
    showSpeakerModal() {
      bus.$emit("showSpeakerModal")
    },
    updateCurrentTime(time) {
      this.currentTime = time
      // Remove playing class from all words
      let activeWords = Array.from(
        document.getElementsByClassName("word playing"),
      ) // need Array.from else it's a HTMLCollection
      if (activeWords.length > 0) {
        for (let word of activeWords) {
          word.classList.remove("playing")
        }
      }
      // Remove playing class from all turns
      let activeTurns = Array.from(
        document.getElementsByClassName("turn playing"),
      )
      if (activeTurns.length > 0) {
        for (let turn of activeTurns) {
          turn.classList.remove("playing")
        }
      }

      // Find current page
      for (let i = 0; i < this.turnPages.length; i++) {
        if (
          time >= this.turnPages[i][0].words[0].stime &&
          time <=
            this.turnPages[i][this.turnPages[i].length - 1].words[
              this.turnPages[i][this.turnPages[i].length - 1].words.length - 1
            ].etime
        ) {
          this.currentPageNb = i
          break
        }
      }

      // Find current Turn
      for (let turn of this.turnPages[this.currentPageNb]) {
        if (
          time >= turn.words[0].stime &&
          time <= turn.words[turn.words.length - 1].etime
        ) {
          // Find current word
          for (let word of turn.words) {
            if (time >= word.stime && time <= word.etime) {
              let wordElement = document.getElementById(word.wid)
              if (wordElement) {
                wordElement.classList.add("playing")
                wordElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                  inline: "center",
                })
              }
            }
          }
          break
        } else if (
          turn.stime &&
          time >= turn.stime &&
          turn.etime &&
          time <= turn.etime
        ) {
          // if no timestamps on word, check timestamps on turn
          let turnElement = document.getElementById(turn.turn_id)
          turnElement.classList.add("playing")
          turnElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          })
        }
      }

      // save to localStorage
      localStorage.setItem(
        "editorCurrentTime",
        JSON.stringify({ time, conversationId: this.conversationId }),
      )
    },
    mergeTurns(index) {
      const baseTurn = this.turns.find((turn) => turn.turn_id === index)
      const baseTurnIndex = this.turns.findIndex(
        (turn) => turn.turn_id === index,
      )
      if (baseTurnIndex === this.turns.length + 1) {
        return
      }

      const baseTurnTextLength = baseTurn.segment.length
      const nextTurnTextLength = this.turns[baseTurnIndex + 1].segment.length
      const totalTextLenght = baseTurnTextLength + nextTurnTextLength
      if (totalTextLenght >= process.env.VUE_APP_TURN_SIZE * 2) {
        bus.$emit("app_notif", {
          status: "error",
          message: this.$t("conversation.turn_cant_merge"),
          //timeout: 3000,
          //redirect: false,
        })
      } else {
        workerSendMessage("turn_merge_paragraph", {
          startTurn: baseTurn,
          endTurn: this.turns[baseTurnIndex + 1],
          indexEnd: baseTurnIndex + 1,
        })
      }
    },
    nextHighlightSearch(tagId) {
      const tag = this.tags[tagId]
      const ranges = tag.ranges
      if (this.clickOnTags[tag._id] === undefined) {
        this.clickOnTags[tag._id] = 0
      } else {
        this.clickOnTags[tag._id] += 1
      }

      if (this.clickOnTags[tag._id] >= ranges.length) {
        this.clickOnTags[tag._id] = 0
      }

      this.goToRange(ranges[this.clickOnTags[tag._id]])
      this.$emit("updateSelectedHighlight", {
        tagId,
        total: ranges.length,
        current: this.clickOnTags[tag._id],
      })
    },
    previousHighlightSearch(tagId) {
      const tag = this.tags[tagId]
      const ranges = tag.ranges
      if (this.clickOnTags[tag._id] === undefined) {
        this.clickOnTags[tag._id] = ranges.length - 1
      } else {
        this.clickOnTags[tag._id] -= 1
      }

      if (this.clickOnTags[tag._id] < 0) {
        this.clickOnTags[tag._id] = ranges.length - 1
      }

      this.goToRange(ranges[this.clickOnTags[tag._id]])
      this.$emit("updateSelectedHighlight", {
        tagId,
        total: ranges.length,
        current: this.clickOnTags[tag._id],
      })
    },
  },
  components: {
    AppEditorTurn,
    AppEditorPlayer,
    AppEditorPagination,
    ModalDeleteTagHighlight,
  },
}
</script>
