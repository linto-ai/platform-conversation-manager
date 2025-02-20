<template>
  <MainContentConversation
    :conversation="conversation"
    :status="status"
    :dataLoaded="dataLoaded"
    :error="error"
    sidebar>
    <template v-slot:sidebar>
      <div>
        <div class="form-field flex col medium-margin gap-medium">
          <AppEditorChannelsSelector
            v-if="channels && channels.length > 0"
            :channels="channels"
            v-model="selectedChannel" />
          <AppEditorTranslationSelector
            v-if="translations && translations.length > 0"
            :translations="translations"
            v-model="selectedTranslation" />
        </div>

        <div class="form-field flex col medium-margin">
          <label for="transcription-search">{{
            $t("app_editor_search.label")
          }}</label>
          <div class="flex gap-small">
            <input
              class="flex1"
              @keydown="($event) => $event.stopPropagation()"
              type="search"
              id="transcription-search"
              v-model="transcriptionSearch" />
            <button
              :title="
                $t('conversation.search_in_transcription.exact_word_match')
              "
              class="icon-only small only-border"
              :class="{ 'green-border': exactMatching }"
              @click="toggleExactMatching">
              <span class="icon equal"></span>
            </button>
            <button
              v-if="transcriptionSearch"
              :title="$t('conversation.search_in_transcription.clear_search')"
              class="icon-only small only-border"
              @click="resetSearch">
              <span class="icon close"></span>
            </button>
          </div>

          <SearchResultPaginator
            class="small-padding-top"
            v-if="numberFound"
            :numberFound="numberFound"
            :selectedIndexResult="selectedIndexResult"
            @previousResult="previousResult"
            @nextResult="nextResult" />
        </div>
        <HighlightsList
          v-if="status === 'done' && experimental_highlight"
          :conversation="conversation"
          :hightlightsCategories="hightlightsCategories"
          :hightlightsCategoriesVisibility="hightlightsCategoriesVisibility"
          @hide-category="onHideCategory"
          @show-category="onShowCategory"
          @delete-tag="onDeleteTag"
          @clickOnTag="onClickOnTag"
          :conversationId="conversation._id">
          <template v-slot:content-under-tag="slotProps">
            <SearchResultPaginator
              v-if="slotProps.tag._id === searchedHighlightId"
              :numberFound="totalHighlightResult"
              :selectedIndexResult="currentHighlightResult"
              @previousResult="onPreviousHighlightSearch(slotProps.tag)"
              @nextResult="onNextHighlightSearch(slotProps.tag)" />
          </template>
        </HighlightsList>
      </div>
    </template>

    <template v-slot:breadcrumb-actions>
      <router-link :to="conversationListRoute" class="btn secondary">
        <span class="icon close"></span>
        <span class="label">{{ $t("conversation.close_editor") }}</span>
      </router-link>

      <h1
        class="flex1 center-text text-cut"
        style="padding-left: 1rem; padding-right: 1rem">
        {{ name }}
      </h1>

      <router-link
        :to="{
          name: 'conversations publish',
          params: { conversationId: conversation._id },
        }"
        class="btn green">
        <span class="icon document"></span>
        <span class="label">{{ $t("conversation.publish_document") }}</span>
      </router-link>
    </template>

    <div class="flex flex1">
      <AppEditor
        :conversation="conversation"
        :rootConversation="rootConversation"
        :channelId="selectedChannel"
        :usersConnected="usersConnected"
        :focusFields="focusFields"
        :conversationUsers="conversationUsers"
        :userInfo="userInfo"
        :filterSpeakers="filterSpeakers"
        :turnPages="turnPages"
        :turns="turns"
        :canEdit="userRights.hasRightAccess(userRight, userRights.WRITE)"
        :hightlightsCategories="hightlightsCategories"
        :hightlightsCategoriesVisibility="hightlightsCategoriesVisibility"
        @newHighlight="handleNewHighlight"
        @foundExpression="onFoundExpression"
        @updateSelectedResult="onUpdateSelectedResult"
        @updateSelectedHighlight="onUpdateSelectedHighlight"
        ref="editor"
        v-if="status === 'done'"></AppEditor>
    </div>

    <ModalDeleteTagHighlight
      v-if="showDeleteModal"
      :conversationId="conversationId"
      :tag="tagToDelete"
      @on-cancel="onCancelDeleteTag"
      @on-confirm="onConfirmDeleteTag" />

    <AppEditorMetadataModal
      v-if="showMetadataModal"
      @on-cancel="cancelMetadata"
      @on-confirm="setMetadata" />
  </MainContentConversation>
</template>
<script>
import moment from "moment"
import { nextTick } from "vue"

import { bus } from "../main.js"
import { apiPostMetadata, apiUpdateMetadata } from "@/api/metadata.js"
import findExpressionInWordsList from "@/tools/findExpressionInWordsList.js"

import { conversationMixin } from "@/mixins/conversation.js"

import Loading from "@/components/Loading.vue"
import Modal from "@/components/Modal.vue"
import UserInfoInline from "@/components/UserInfoInline.vue"
import AppEditor from "@/components/AppEditor.vue"
import MainContentConversation from "@/components/MainContentConversation.vue"
import HighlightsList from "@/components/HighlightsList.vue"
import MenuToolbox from "@/components/MenuToolbox.vue"
import ModalDeleteTagHighlight from "@/components/ModalDeleteTagHighlight.vue"
import TranscriptionHelper from "@/components/TranscriptionHelper.vue"
import AppEditorMetadataModal from "@/components/AppEditorMetadataModal.vue"
import SearchResultPaginator from "@/components/SearchResultPaginator.vue"
import AppEditorChannelsSelector from "@/components/AppEditorChannelsSelector.vue"
import AppEditorTranslationSelector from "../components/AppEditorTranslationSelector.vue"

export default {
  mixins: [conversationMixin],
  data() {
    return {
      selfUrl: (convId) => `/interface/conversations/${convId}/transcription`,
      filterSpeakers: "default",
      helperVisible: false,
      status: null,
      showDeleteModal: false,
      tagToDelete: null,
      showMetadataModal: false,
      metadataModalData: null,
      transcriptionSearch: "",
      numberFound: 0,
      selectedIndexResult: 0,
      exactMatching: false,
      searchedHighlightId: null,
      currentHighlightResult: 0,
      totalHighlightResult: 0,
      turnsIndexedByid: {},
      turns: [],
      turnPages: [],
    }
  },
  mounted() {
    bus.$on("open-metadata-modal", (data) => {
      this.showMetadataModal = true
      this.metadataModalData = data
    })

    bus.$on("segment_updated", (data) => {
      this.turnsIndexedByid[data.turnId].segment = data.value
    })

    bus.$on("words_updated", (data) => {
      this.turnsIndexedByid[data.turnId].words = data.value
    })

    bus.$on("turn_speaker_update", (data) => {
      this.turnsIndexedByid[data.turnId].speaker_id = data.value
    })

    bus.$on("refresh_turns", () => {
      this.setupTurns()
    })
  },
  beforeDestroy() {
    bus.$off("open-metadata-modal")
    bus.$off("segment_updated")
    bus.$off("words_updated")
    bus.$off("refresh_turns")
    bus.$off("turn_speaker_update")
  },
  watch: {
    "conversation.speakers"(newVal, oldVal) {
      if (
        this.filterSpeakers != "default" &&
        newVal.filter((spk) => spk.speaker_id == this.filterSpeakers).length ==
          0
      ) {
        this.filterSpeakers = "default"
      }
    },
    dataLoaded(newVal, oldVal) {
      if (newVal) {
        this.status = this.computeStatus(this.conversation?.jobs?.transcription)
      }
    },
    transcriptionSearch(newVal, oldVal) {
      if (newVal != oldVal) {
        bus.$emit("player-pause")
        this.$refs.editor.searchInTranscription(newVal, this.exactMatching)
      }
    },
  },
  computed: {
    experimental_highlight() {
      return process.env?.VUE_APP_EXPERIMENTAL_HIGHLIGHT === "true"
    },
    conversationListRoute() {
      return { name: "inbox", hash: "#previous" }
    },
    dataLoaded() {
      return this.conversationLoaded
    },
    exportFileTitle() {
      return `${this.conversation.name.replace(/\s/g, "_")}_${moment().format(
        "YYYYMMDDHHmmss",
      )}`
    },
  },
  methods: {
    initConversationHook() {
      this.setupTurns()
    },
    setupTurns() {
      this.turnPages = [[]]
      this.turnsIndexedByid = {}
      this.turns = []

      let currentPage = 0
      let nbCaracters = 0
      let nbTurns = 0
      this.turnPages[currentPage] = []

      for (let shadowTurn of this.conversation.text) {
        if (shadowTurn.words.length === 0) {
          continue
        }
        const turn = structuredClone(shadowTurn)
        this.turnsIndexedByid[turn.turn_id] = turn
        this.turns.push(turn)

        // Split the turns in pages
        this.turnPages[currentPage].push(turn)
        nbCaracters += turn.segment.length
        if (
          nbCaracters > parseInt(process.env.VUE_APP_MAX_CARACTERS_PER_PAGE)
        ) {
          nbCaracters = 0
          nbTurns = 0
          currentPage += 1
          this.turnPages[currentPage] = []
        }
        nbTurns += 1
        if (nbTurns > parseInt(process.env.VUE_APP_TURN_PER_PAGE)) {
          nbCaracters = 0
          nbTurns = 0
          currentPage += 1
          this.turnPages[currentPage] = []
        }
      }

      if (this.turnPages.at(-1).length === 0) {
        this.turnPages.pop()
      }
    },
    onClickOnTag(tag) {
      this.$refs.editor.nextHighlightSearch(tag._id)
    },
    onNextHighlightSearch(tag) {
      this.$refs.editor.nextHighlightSearch(tag._id)
    },
    onPreviousHighlightSearch(tag) {
      this.$refs.editor.previousHighlightSearch(tag._id)
    },
    onFoundExpression(number) {
      this.numberFound = number
    },
    onUpdateSelectedResult(number) {
      this.selectedIndexResult = number
    },
    nextResult() {
      this.$refs.editor.nextResultFound()
    },
    previousResult() {
      this.$refs.editor.previousResultFound()
    },
    cancelMetadata() {
      this.showMetadataModal = false
    },
    async setMetadata(fields, schema) {
      this.showMetadataModal = false
      console.log("set-metadata", fields, schema, this.metadataModalData)
      apiPostMetadata(
        this.conversationId,
        this.metadataModalData.tag._id,
        schema.name,
        fields.reduce(
          (obj, field) => ({ ...obj, [field.key]: field.value }),
          {},
        ),
      )
      // Todo: only update the right metadata
      await this.fetchHightlightsCategories(this.conversationId)
      //bus.$emit("set-metadata", fields)
    },
    showHelper() {
      this.helperVisible = true
    },
    closeHelper() {
      this.helperVisible = false
    },
    onHideCategory(categoryId) {
      this.hightlightsCategoriesVisibility = {
        ...this.hightlightsCategoriesVisibility,
        [categoryId]: false,
      }
    },
    onShowCategory(categoryId) {
      this.hightlightsCategoriesVisibility = {
        ...this.hightlightsCategoriesVisibility,
        [categoryId]: true,
      }
    },
    onDeleteTag(tag) {
      this.tagToDelete = tag
      this.showDeleteModal = true
    },
    onCancelDeleteTag() {
      this.showDeleteModal = false
    },
    onConfirmDeleteTag() {
      this.showDeleteModal = false
    },
    async handleNewHighlight({ tag, wordsSelected }) {
      const metadata = (tag.metadata ?? []).filter((m) => m.schema == "words")
      let post = false
      let ranges = []
      let metadataId = null

      if (metadata.length == 0) {
        post = true
      } else {
        ranges = metadata[0]?.value?.range_id ?? []
        metadataId = metadata[0]._id
      }

      ranges.push({
        startId: wordsSelected[0].wid,
        endId: wordsSelected[wordsSelected.length - 1].wid,
      })

      if (post) {
        await apiPostMetadata(this.conversationId, tag._id, "words", {
          range_id: ranges,
        })
      } else {
        await apiUpdateMetadata(this.conversationId, tag._id, metadataId, {
          range_id: ranges,
        })
      }

      // reload highlights ?
      await this.fetchHightlightsCategories(this.conversationId)
      await nextTick()
      this.hightlightsCategoriesVisibility = {
        ...this.hightlightsCategoriesVisibility,
        [tag.categoryId]: true,
      }
    },
    toggleExactMatching() {
      this.exactMatching = !this.exactMatching
      this.$refs.editor.searchInTranscription(
        this.transcriptionSearch,
        this.exactMatching,
      )
    },
    resetSearch() {
      this.transcriptionSearch = ""
      this.numberFound = 0
      this.selectedIndexResult = 0
      this.$refs.editor.searchInTranscription("")
    },
    onUpdateSelectedHighlight({ tagId, total, current }) {
      this.searchedHighlightId = tagId
      this.currentHighlightResult = current
      this.totalHighlightResult = total
    },
  },
  components: {
    TranscriptionHelper,
    Loading,
    Modal,
    UserInfoInline,
    AppEditor,
    MainContentConversation,
    HighlightsList,
    MenuToolbox,
    ModalDeleteTagHighlight,
    AppEditorMetadataModal,
    SearchResultPaginator,
    AppEditorChannelsSelector,
    AppEditorTranslationSelector,
  },
}
</script>
