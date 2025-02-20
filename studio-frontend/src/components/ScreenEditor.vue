<template>
  <div class="flex gap-small" id="screen-editor">
    <div class="flex1">
      <ScreenEditorBox
        v-if="prev"
        :user-info="userInfo"
        :label="$t('conversation.subtitles.screens.previous_screen')"
        :screen="prev"
        :can-edit="canEdit"
        :conversation-id="conversationId"
        :conversation-users="conversationUsers"
        :focusFields="focusFields"
        :users-connected="usersConnected"
        @click="seekTo(prev.stime)">
      </ScreenEditorBox>
    </div>
    <ScreenActions
      :left-screen-id="prev?.screen_id"
      :right-screen-id="selectedScreen.screen_id"
      :can-edit="canEdit"
      @add="addScreens"
      @merge="mergeScreens"></ScreenActions>
    <div class="flex1">
      <ScreenEditorBox
        :user-info="userInfo"
        :label="$t('conversation.subtitles.screens.current_screen')"
        :screen="selectedScreen"
        :can-edit="canEdit"
        is-current
        :conversation-id="conversationId"
        :conversation-users="conversationUsers"
        :focusFields="focusFields"
        :users-connected="usersConnected"
        @textUpdate="textUpdate">
      </ScreenEditorBox>
    </div>
    <ScreenActions
      :left-screen-id="selectedScreen.screen_id"
      :right-screen-id="next?.screen_id"
      :can-edit="canEdit"
      @add="addScreens"
      @merge="mergeScreens"></ScreenActions>
    <div class="flex1">
      <ScreenEditorBox
        v-if="next"
        :user-info="userInfo"
        :label="$t('conversation.subtitles.screens.next_screen')"
        :screen="next"
        :can-edit="canEdit"
        :conversation-id="conversationId"
        :conversation-users="conversationUsers"
        :focusFields="focusFields"
        :users-connected="usersConnected"
        @click="seekTo(next.stime)">
      </ScreenEditorBox>
    </div>
  </div>
</template>
<script>
import { ScreenList } from "../models/screenList"
import { bus } from "../main.js"
import ScreenActions from "./ScreenActions.vue"
import ScreenEditorBox from "./ScreenEditorBox.vue"

export default {
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
    screens: {
      type: ScreenList,
      required: true,
    },
    canEdit: {
      type: Boolean,
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
    },
    conversationUsers: {
      type: Array,
      required: true,
      default: () => [],
    },
    usersConnected: {
      type: Array,
      default: () => [],
    },
    focusFields: {
      type: Object,
      required: true,
    },
    previousScreenId: {
      type: String,
      required: false,
    },
    playingScreenId: {
      type: String,
      required: true,
    },
    nextScreenId: {
      type: String,
      required: false,
    },
  },
  computed: {
    currentScreen() {
      return this.screens.get(this.playingScreenId)
    },
    selectedScreen() {
      return this.screens.get(this.playingScreenId)?.screen
    },
    prev() {
      return this.screens.get(this.previousScreenId)?.screen
    },
    next() {
      return this.screens.get(this.nextScreenId)?.screen
    },
  },
  methods: {
    seekTo(stime) {
      bus.$emit("player_set_time", { stime })
    },
    addScreens(leftScreenId, rightScreenId) {
      this.$emit("addScreen", leftScreenId, rightScreenId)
    },
    mergeScreens(leftScreenId, rightScreenId) {
      if (leftScreenId === this.selectedScreen.screen_id) {
        this.$emit("mergeScreens", leftScreenId, rightScreenId)
      } else {
        this.$emit("mergeScreens", rightScreenId, leftScreenId)
      }
    },
    textUpdate(screenId, text) {
      this.$emit("textUpdate", screenId, text)
    },
  },
  components: {
    ScreenActions,
    ScreenEditorBox,
  },
}
</script>
