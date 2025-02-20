<template>
  <div
    v-if="canEdit"
    class="form-field fullwidth flex col"
    :style="editorTurn ? 'margin: 0;' : ''">
    <span class="form-label" v-if="label !== false">{{ label }}</span>
    <div class="flex col">
      <div
        :contenteditable="this.editable"
        :disabled="disabled"
        @input="handleInput"
        @keyup="keyup"
        @keydown="keydown"
        @click="handleFocus"
        @focus="handleFocus"
        @blur="handleBlur"
        @unfocus="handleBlur"
        @paste="handlePaste"
        :class="[
          'collab-input',
          usersConnectedNames.length > 0 ? 'focused' : '',
          customClass ? customClass : '',
        ]"
        :id="flag"></div>
      <div
        class="flex row user-connected-container align-center"
        v-if="!hideUsersConnected">
        <span
          v-for="user in usersConnectedNames"
          class="user-connected"
          :key="user"
          >{{ user }}
        </span>
      </div>
    </div>
  </div>
  <div v-else>
    <div>
      <div class="form-label">{{ label }}</div>
      <div>{{ _currentValue }}</div>
    </div>
  </div>
</template>
<script>
import { workerSendMessage } from "../tools/worker-message.js"
import { calculCursorPos } from "../tools/calculCursorPos.js"
import { bus } from "../main.js"
import { Throttle } from "../tools/throttle.js"
import createMultiLineContent from "../tools/createMultiLineContent.js"
import formatCollaborativeText from "../tools/formatCollaborativeText.js"

import { customDebug } from "../tools/customDebug.js"
export default {
  props: {
    label: { default: () => false, required: true },
    startValue: { type: String, required: true },
    editable: { type: Boolean, default: () => true },
    flag: { type: String, required: true },
    usersConnected: { type: Array, required: true },
    conversationId: { type: String, required: true },
    conversationUsers: { type: Array, required: true },
    userId: { type: String, required: true },
    customClass: { type: String, required: false },
    disabled: { type: Boolean, default: () => false },
    hideUsersConnected: { type: Boolean, default: () => false },
    editorTurn: { type: Boolean, default: () => false },
    canEdit: { type: Boolean, default: () => false },
    turnWords: { type: Array, required: false },
    cursorPosition: { type: Object, required: false },
    disabledEnter: { type: Boolean, required: false, default: () => true },
    enableMultiLine: { type: Boolean, required: false, default: () => false },
  },
  data() {
    const throttleObject = new Throttle()
    const throttleObjectFocus = new Throttle()
    return {
      value: "",
      top: 0,
      left: 0,
      _currentValue: "",
      isMovingCursor: false,
      unThrottledInputEvent: ["insertParagraph"],
      focused: false,
      throttleObject: throttleObject,
      throttleUpdateField: throttleObject.createThrottle(this.updateField, 500),
      throttleKeepFocus: throttleObjectFocus.createThrottle(
        this.keepFocus,
        15000
      ),
      debugCollaborativeField: customDebug("vue:debug:field"),
      stackLetter: [],
    }
  },
  mounted() {
    bus.$on("update_field", (data) => {
      this.applyChangesFromWorker(data)
    })

    if (
      this.cursorPosition &&
      this.cursorPosition.wordIndex != null &&
      this.cursorPosition.wordCharIndex != null
    ) {
      this.$nextTick(() => {
        this.setCursorFromWordIndex(
          this.cursorPosition.wordIndex,
          this.cursorPosition.wordCharIndex,
          this.cursorPosition.lineIndex
        )
      })
    }

    this.currentValue = this.startValue
  },
  beforeDestroy() {
    bus.$off("update_field")
  },
  computed: {
    usersConnectedNames() {
      let usersConnectedNames = []
      if (this.conversationUsers && this.conversationUsers.length > 0) {
        this.usersConnected.map((user) => {
          if (user.inputField === this.flag) {
            let userOnField = this.conversationUsers.find(
              (usr) => usr._id === user.userId
            )
            if (userOnField)
              usersConnectedNames.push(
                userOnField.firstname + " " + userOnField.lastname
              )
          }
        })
      }
      return usersConnectedNames
    },
    currentValue: {
      get() {
        return this._currentValue
      },
      set(value) {
        this._currentValue = value
        let contentContainer = document.getElementById(this.flag)
        if (this.enableMultiLine) {
          contentContainer.innerHTML = ""
          for (const line of createMultiLineContent(value)) {
            contentContainer.append(line)
          }
        } else {
          contentContainer.innerText = value
        }
      },
    },
  },
  watch: {
    cursorPosition(data) {
      if (data && data.wordIndex != null && data.wordCharIndex != null) {
        this.setCursorFromWordIndex(
          data.wordIndex,
          data.wordCharIndex,
          data.lineIndex
        )
      }
    },
  },
  methods: {
    keepFocus() {
      workerSendMessage("focus_field", {
        field: this.flag,
        userId: this.userId,
      })
    },
    handleInput(e) {
      this.$emit("contentUpdate", e?.target?.innerText)
      if (this.unThrottledInputEvent.indexOf(e.inputType) === -1) {
        this.throttleUpdateField(e)
        this.throttleKeepFocus()
      } else {
        this.throttleObject.executeNow()
        return this.updateField(e)
      }
    },
    handleFocus(e) {
      workerSendMessage("focus_field", {
        field: this.flag,
        userId: this.userId,
      })
      const selection = window.getSelection()
      if (
        selection.type === "Caret" &&
        this.focused === true &&
        !this.enableMultiLine
      ) {
        this.getWordFromPlainText(selection)
      }

      this.focused = true
      this.$emit("focus", e)
    },
    getWordFromPlainText(selection) {
      const text = selection.anchorNode.textContent
      const charPos = selection.anchorOffset
      const splitText = text.split(" ")

      let wordIndex = 0
      let tmpChar = 0
      for (let i = 0; i < splitText.length; i++) {
        if (tmpChar + splitText[i].length + 1 < charPos) {
          wordIndex++
          tmpChar += splitText[i].length + 1
        } else {
          break
        }
      }
      if (this.turnWords) {
        const words = this.turnWords.filter((word) => word.words !== "")
        const stime = words[wordIndex - 1]?.stime || words[0].stime
        if (stime) {
          bus.$emit("player_set_time", { stime })
        }
      }
    },
    handleBlur(e) {
      this.throttleObject.executeNow()
      workerSendMessage("unfocus_field", {
        field: this.flag,
        userId: this.userId,
      })
      this.focused = false
      this.$emit("blur", e)
    },
    handlePaste(e) {
      e.preventDefault()
      let text = e.clipboardData.getData("text/plain")
      // remove double space from text
      text = text.replace(/\s\s+/g, " ").trim()
      document.execCommand("insertText", false, text)
    },
    keyup(e) {
      this.handleFocus(e)
      this.$emit("keyup", e)
    },
    keydown(e) {
      // Prevent delete all content of a turn
      // TODO: implement deleting turn if empty instead of preventing deletion
      if (e.key === "Backspace" || e.key === "Delete") {
        const text = document.getElementById(this.flag).innerText
        if (text.length === 1) {
          e.preventDefault()
          return
        }
      }

      if (e.key === "Enter") {
        if (this.disabledEnter || e.shiftKey) {
          e.preventDefault()
          return
        }
        const cursorPosition = window.getSelection().anchorOffset
        this.$emit("enter", {
          e,
          cursorPosition,
          currentValue: document.getElementById(this.flag).innerText, //this.currentValue,
        })
        e.preventDefault()
      } else if (this.isMovingCursor) {
        if (e.key && e.key.length === "1") {
          this.stackLetter.push(e.key)
        }
        e.preventDefault()
      } else {
        this.handleFocus(e)
        this.$emit("keydown", e)
        e.stopPropagation()
      }
    },
    updateField(e) {
      if (e.inputType !== "insertParagraph") {
        this.isMovingCursor = true
        this.removeDoubleSpace(e)
      }

      this.$emit("input", e)
    },

    removeDoubleSpace(inputField) {
      let currentCursorPosition = window.getSelection().anchorOffset
      let initialLineIndex = this.getLineIndex()

      let { formatedText, lineIndex, cursorPosition } = formatCollaborativeText(
        inputField.target,
        currentCursorPosition,
        initialLineIndex,
        this.enableMultiLine
      )

      console.log(lineIndex, cursorPosition)

      this.currentValue = formatedText
      this.$emit("contentUpdate", formatedText)
      this.setCursorPos(cursorPosition, lineIndex)
    },
    applyChangesFromWorker(data) {
      if (
        data.flag === this.flag &&
        data.conversationId === this.conversationId
      ) {
        if (this.focused) {
          this.debugCollaborativeField(
            "applyChangesFromWorker",
            data.delta,
            data.value
          )
          this.toggleCursorPos(data.delta, data.value)
        } else {
          this.currentValue = data.value
        }
      }
    },
    toggleCursorPos(delta, value) {
      this.isMovingCursor = true
      const selection = window.getSelection()
      let baseIndex = selection.anchorOffset
      const lineIndex = this.getLineIndex()
      let newIndex = calculCursorPos(baseIndex, delta)
      this.debugCollaborativeField(
        "new cursor position %n to %n",
        baseIndex,
        newIndex
      )
      this.currentValue = value
      this.$emit("contentUpdate", value)
      this.setCursorPos(newIndex, lineIndex)
    },
    setCursorPos(newIndex, lineIndex) {
      this.isMovingCursor = true
      this.$nextTick(() => {
        const element = document.getElementById(this.flag)
        try {
          const selection = window.getSelection()

          if (selection) {
            this.debug("move cursor to", newIndex)
            let node
            if (this.enableMultiLine) {
              node = element.childNodes[lineIndex].firstChild
            } else {
              node = element.childNodes[0]
            }
            selection.collapse(node, newIndex)
          }
        } catch (error) {
          console.error(error)
        } finally {
          if (this.enableMultiLine) {
            element.childNodes[lineIndex].focus()
          } else {
            element.focus()
          }
          document.execCommand("insertText", this.stackLetter.join(""))
          this.stackLetter = []
          this.isMovingCursor = false
        }
      })
    },
    setCursorFromWordIndex(wordIndex, wordCharIndex, lineIndex) {
      let el
      if (this.enableMultiLine) {
        el = document.getElementById(this.flag).childNodes[lineIndex]
      } else {
        el = document.getElementById(this.flag)
      }
      if (!!el) {
        let text = el.innerText
        let charIndex = this.getWordCharIndex(text, wordIndex)
        this.setCursorPos(charIndex + wordCharIndex - 1, lineIndex)
      }
    },
    getWordCharIndex(text, index) {
      let splitText
      if (this.turnWords) {
        splitText = this.turnWords.map((w) => w.word)
      } else {
        splitText = text.trim().split(" ")
      }

      let charIndex = 1
      for (let i = 0; i < index; i++) {
        charIndex += splitText[i].length + 1
      }
      return charIndex
    },
    getLineIndex() {
      if (!this.enableMultiLine) return 0

      let currentLine = window.getSelection().anchorNode
      if (currentLine.childNodes.length === 0) {
        currentLine = currentLine.parentNode
      }
      let lineIndex = 0
      currentLine = currentLine.previousSibling
      while (currentLine) {
        lineIndex++
        currentLine = currentLine.previousSibling
      }
      return lineIndex
    },
  },
}
</script>
