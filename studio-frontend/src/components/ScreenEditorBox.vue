<template>
  <div v-if="screen" @click="(e) => $emit('click', e)">
    <div class="flex align-center">
      <label
        class="form-label flex1"
        :id="isCurrent ? 'current-screen-label' : ''"
        :for="flag">
        {{ label }}
      </label>
      <!-- <button class="red-border icon-only small">
        <span class="icon trash"></span>
      </button> -->
      <div
        class="flex row user-connected-container align-center"
        ref="turn-users-connected">
        <span v-if="focusBy" class="user-connected">
          {{ focusBy }}
        </span>
      </div>
    </div>
    <div
      v-if="!isCurrent || !canEdit || locked"
      :class="[
        'screen-preview',
        isCurrent ? 'current' : '',
        locked ? 'locked' : '',
      ]">
      <p v-for="line of screen.text">
        {{ line }}
      </p>
    </div>
    <textarea
      v-else
      wrap="off"
      :id="flag"
      @blur="handleBlur"
      @input="onInput"
      v-model="currentValue"
      @focus="onCurrentScreenClick"
      :class="['screen-preview', isCurrent ? 'current' : '', 'fullwidth']"
      >{{ startValue }}
    </textarea>
    <!-- <CollaborativeField
      v-else
      :label="false"
      :startValue="startValue"
      :flag="flag"
      :users-connected="usersConnected"
      :conversation-users="conversationUsers"
      :conversation-id="conversationId"
      :user-id="userInfo._id"
      :customClass="'fullwidth screen-preview current'"
      :hide-users-connected="true"
      :editor-turn="true"
      :can-edit="canEdit"
      :turn-words="screenWords"
      :cursor-position="cursorPosition"
      :disabled-enter="false"
      :enable-multi-line="true"
      @blur="handleBlur"
      @input="handleContentUpdate">
    </CollaborativeField> -->
  </div>
</template>
<script>
import { getCookie } from "../tools/getCookie"
import { workerSendMessage } from "../tools/worker-message"
import { Throttle } from "../tools/throttle.js"

import CollaborativeField from "./CollaborativeField.vue"

export default {
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    screen: {
      type: Object,
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: false,
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
  },
  data() {
    const throttleObjectFocus = new Throttle()
    const throttleObjectChange = new Throttle()
    console.log(this.screen)
    return {
      focused: false,
      cursorPosition: {
        wordIndex: 0,
        wordCharIndex: 0,
        lineIndex: 0,
      },
      throttleKeepFocus: throttleObjectFocus.createThrottle(
        this.keepFocus,
        15000
      ),
      throttleChange: throttleObjectChange.createThrottle(
        this.handleChange,
        500
      ),
      currentValue: this.screen.text.join("\n"),
    }
  },
  watch: {
    screen: {
      handler() {
        this.currentValue = this.startValue
      },
      deep: true,
    },
  },
  computed: {
    screenId() {
      return this.screen.screen_id
    },
    flag() {
      return `screen-${this.screenId}`
    },
    startValue() {
      return this.screen.text.join("\n")
    },
    screenWords() {
      return this.screen.words.filter((word) => word.word !== "")
    },
    locked() {
      const isFocus = this.focusFields?.[this.flag]
      if (isFocus && isFocus.userToken !== getCookie("authToken")) {
        return true
      }
      return false
    },
    focusBy() {
      const isFocus = this.focusFields?.[this.flag]
      if (isFocus) {
        const user = this.conversationUsers.find(
          (usr) => usr._id === isFocus.userId
        )
        return user.firstname + " " + user.lastname
      }

      return null
    },
  },
  methods: {
    onInput() {
      this.throttleKeepFocus()
      this.throttleChange()
    },
    onCurrentScreenClick() {
      //this.focused = true
      // this.$nextTick(() => {
      //   document.getElementById(this.flag).focus()
      // })
      workerSendMessage("focus_field", {
        field: this.flag,
        userId: this.userInfo._id,
      })
    },
    keepFocus() {
      workerSendMessage("keep_focus", {
        field: this.flag,
        userId: this.userInfo._id,
      })
    },
    handleBlur() {
      workerSendMessage("unfocus_field", {
        field: this.flag,
        userId: this.userInfo._id,
      })
      this.focused = false
    },
    handleChange(value) {
      this.$emit("textUpdate", this.screenId, this.currentValue)
    },
  },
  components: {
    CollaborativeField,
  },
}
</script>
