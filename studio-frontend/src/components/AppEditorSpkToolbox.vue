<template>
  <!-- TODO: use <form> and submit button for accessibility-->
  <!-- Add speaker form -->
  <ContextMenu
    first
    :x="1"
    :y="18"
    name="speaker-menu"
    @keydown="stopPropagation"
    @click="stopPropagation"
    class="context-menu__speaker reset-color">
    <!-- -- -- Change speaker -- -- -->

    <div class="context-menu__element" v-if="speakersList.length > 0">
      <button
        class="transparent flex context-menu__action wrap"
        :selected="state == STATES.CHANGE_SPEAKER"
        @click="enterChangeSpeaker">
        <span class="icon replace"></span>
        <span class="label flex1">
          {{ $t("conversation.speaker_toolbox.change_speaker_button") }}
        </span>
        <span class="icon right-arrow"></span>
      </button>

      <ContextMenu
        name="change-speaker"
        v-if="state == STATES.CHANGE_SPEAKER"
        class="overflow-vertical-auto">
        <div class="flex col gap-small">
          <button
            v-for="spk of speakersList"
            @click="updateSpeaker(spk.speaker_id)"
            class="only-border">
            <span class="icon speaker"></span>
            <span class="label">{{ spk.speaker_name }}</span>
          </button>
        </div>
      </ContextMenu>
    </div>

    <!-- -- -- Edit speaker -- -- -->

    <div class="context-menu__element">
      <button
        class="transparent flex context-menu__action wrap"
        :selected="state == STATES.EDIT_SPEAKER"
        @click="enterEditSpeaker">
        <span class="icon edit"></span>
        <span class="label flex1">
          {{
            $t("conversation.speaker_toolbox.edit_speaker_button", {
              current: currentSpeakerName,
            })
          }}
        </span>
        <span class="icon right-arrow"></span>
      </button>

      <ContextMenu name="edit-speaker" v-if="state == STATES.EDIT_SPEAKER">
        <form class="flex col gap-small">
          <FormInput :field="editSpeakerName" v-model="editSpeakerName.value" />
          <div class="flex row justify-evenly">
            <!-- type=button so other button is used when enter key -->
            <button
              type="button"
              @click="toggleEditSpeaker"
              class="speaker-toolbox-input-btn red">
              <span class="icon close"></span>
            </button>
            <button
              class="speaker-toolbox-input-btn green"
              type="submit"
              default
              @click="editSpeaker">
              <span class="icon valid"></span>
            </button>
          </div>
        </form>
      </ContextMenu>
    </div>

    <!-- -- -- Merge speaker -- -- -->

    <div
      class="context-menu__element"
      @click="enterMergeSpeaker"
      v-if="speakersList.length > 0">
      <button
        class="transparent flex context-menu__action wrap"
        :selected="state == STATES.MERGE_SPEAKER"
        @click="enterMergeSpeaker">
        <span class="icon merge"></span>
        <span class="label flex1">
          {{
            $t("conversation.speaker_toolbox.merge_speaker_button", {
              name: currentSpeakerName,
            })
          }}
        </span>
        <span class="icon right-arrow"></span>
      </button>

      <ContextMenu
        name="change-speaker"
        v-if="state == STATES.MERGE_SPEAKER"
        class="overflow-vertical-auto">
        <div class="flex col gap-small">
          <button
            v-for="spk of speakersList"
            @click="mergeSpeaker(spk.speaker_id)"
            class="only-border">
            <span class="icon speaker"></span>
            <span class="label">{{ spk.speaker_name }}</span>
          </button>
        </div>
      </ContextMenu>
    </div>

    <!-- -- -- Create speaker -- -- -->

    <div class="context-menu__element">
      <button
        class="transparent flex context-menu__action wrap"
        :selected="state == STATES.CREATE_SPEAKER"
        @click="enterCreateSpeaker">
        <span class="icon add"></span>
        <span class="label flex1">
          {{ $t("conversation.speaker_toolbox.create_speaker_button") }}
        </span>
        <span class="icon right-arrow"></span>
      </button>

      <ContextMenu name="create-speaker" v-if="state == STATES.CREATE_SPEAKER">
        <form class="flex col gap-small">
          <FormInput :field="addSpeakerName" v-model="addSpeakerName.value" />
          <div class="flex row justify-evenly">
            <!-- type=button so other button is used when enter key -->
            <button
              type="button"
              @click="toggleAddSpeaker"
              class="speaker-toolbox-input-btn red">
              <span class="icon close"></span>
            </button>
            <button
              class="speaker-toolbox-input-btn green"
              type="submit"
              default
              @click="addSpeaker">
              <span class="icon valid"></span>
            </button>
          </div>
        </form>
      </ContextMenu>
    </div>
  </ContextMenu>
</template>
<script>
import { workerSendMessage } from "../tools/worker-message.js"
import { bus } from "../main.js"
import EMPTY_FIELD from "@/const/emptyField.js"

import ContextMenu from "./ContextMenu.vue"
import FormInput from "./FormInput.vue"

const STATES = {
  CHANGE_SPEAKER: 1,
  EDIT_SPEAKER: 2,
  MERGE_SPEAKER: 3,
  CREATE_SPEAKER: 4,
}

export default {
  props: {
    speakers: {
      type: Array,
      required: true,
    },
    speakerId: {
      type: String,
      required: true,
    },
    turnId: {
      type: String,
      required: true,
    },
    turnIndex: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      showAddSpeakerForm: false,
      editSpeakerName: {
        ...EMPTY_FIELD,
        value: this.currentSpeakerName,
        label: this.$t("conversation.speaker_toolbox.edit_speaker_label"),
      },
      addSpeakerName: {
        ...EMPTY_FIELD,
        value: "",
        error: null,
        valid: false,
        label: this.$t("conversation.speaker_toolbox.create_speaker_label"),
      },
      spkBtn: null,
      state: null,
      STATES,
    }
  },
  computed: {
    speakersList() {
      return this.speakers
        .filter((spk) => spk.speaker_id !== this.speakerId)
        .sort((a, b) => a.speaker_name.localeCompare(b.speaker_name))
    },
    showList() {
      return !this.showAddSpeakerForm && !this.showEditSpeakerForm
    },
    "addSpeakerName.value"(val) {
      this.$options.filters.testFieldEmpty(this.addSpeakerName)
    },
    currentSpeakerName() {
      try {
        return this.speakers.find((spk) => spk.speaker_id === this.speakerId)
          .speaker_name
      } catch (e) {
        return "unknown speaker name"
      }
    },
  },
  mounted() {},
  methods: {
    stopPropagation(e) {
      console.log("stopPropagation")
      e.stopPropagation()
    },
    enterChangeSpeaker(e) {
      this.state = STATES.CHANGE_SPEAKER
      e.stopPropagation()
    },
    enterEditSpeaker(e) {
      this.state = STATES.EDIT_SPEAKER
      e.stopPropagation()
    },
    enterMergeSpeaker(e) {
      this.state = STATES.MERGE_SPEAKER
      e.stopPropagation()
    },
    enterCreateSpeaker(e) {
      this.state = STATES.CREATE_SPEAKER
      e.stopPropagation()
    },
    addSpeakerKeyDown(e) {
      if (e.key === "Enter") {
        this.addSpeaker()
      }
    },
    editSpeakerKeyDown(e) {
      if (e.key === "Enter") {
        this.editSpeaker()
      }
    },
    toggleAddSpeaker() {
      this.state = null
      this.addSpeakerName.value = ""
      this.addSpeakerName.error = null
      this.addSpeakerName.valid = false
    },
    toggleEditSpeaker() {
      this.state = null
      this.editSpeakerName.value = this.currentSpeakerName
      this.editSpeakerName.error = null
      this.editSpeakerName.valid = true
    },
    editSpeaker(e) {
      e?.preventDefault()
      e?.stopPropagation()
      this.$options.filters.testFieldEmpty(this.editSpeakerName)
      console.log("editSpeaker", this.editSpeakerName)
      if (this.editSpeakerName.valid) {
        let speakersNames = this.speakers.map((spk) => spk.speaker_name)
        // TODO: put this logic in testName ?
        if (speakersNames.includes(this.editSpeakerName.value)) {
          this.editSpeakerName.error = "This name is already used"
          this.editSpeakerName.valid = false
        } else {
          let payload = {
            conversationId: this.conversationId,
            newSpeakerName: this.editSpeakerName.value,
            speakerId: this.speakerId,
          }
          workerSendMessage("update_conversation_speaker_name", payload)
        }
      }
      return false
    },
    addSpeaker(e) {
      e?.preventDefault()
      e?.stopPropagation()
      this.$options.filters.testFieldEmpty(this.addSpeakerName)
      if (this.addSpeakerName.valid) {
        workerSendMessage("update_conversation_add_speaker", {
          speakerName: this.addSpeakerName.value,
          turnId: this.turnId,
          turnIndex: this.turnIndex,
        })
      }
      return false
    },
    updateSpeaker(newSpeakerId) {
      this.$options.filters.testFieldEmpty(this.addSpeakerName)

      workerSendMessage("turn_edit_speaker", {
        turnId: this.turnId,
        turnIndex: this.turnIndex,
        newSpeakerId,
      })
    },
    mergeSpeaker(newSpeakerId) {
      workerSendMessage("turn_merge_speaker", {
        currentSpeakerId: this.speakerId,
        newSpeakerId,
      })
    },
    closeToolbox() {
      bus.$emit("close_spk_toolbox", { turnId: this.turnId })
    },
  },
  components: { ContextMenu, FormInput },
}
</script>
