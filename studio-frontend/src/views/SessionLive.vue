<template>
  <MainContent noBreadcrumb :organizationPage="false" fullwidthContent sidebar>
    <template v-slot:breadcrumb-actions>
      <router-link :to="sessionListRoute" class="btn secondary">
        <span class="icon back"></span>
        <span class="label">{{
          $t("session.detail_page.back_to_listing")
        }}</span>
      </router-link>

      <!-- title -->
      <SessionStatus
        v-if="sessionLoaded"
        :session="session"
        withText
        class="flex1" />

      <router-link :to="settingsRoute" class="btn" v-if="isAtLeastMaintainer">
        <span class="icon settings"></span>
        <span class="label">{{
          $t("session.detail_page.settings_button")
        }}</span>
      </router-link>
    </template>

    <template v-slot:sidebar>
      <!-- <div
        class="flex col medium-padding gap-medium"
        v-if="isStarted || isTerminated"
      > -->
      <div class="flex col medium-padding gap-medium">
        <SessionChannelsSelector
          v-if="sessionLoaded && selectedChannel"
          :channels="channels"
          v-model="selectedChannel"></SessionChannelsSelector>

        <SessionTranslationSelection
          v-if="sessionLoaded && selectedChannel"
          :selectedChannel="selectedChannel"
          v-model="selectedTranslations"></SessionTranslationSelection>

        <h3>{{ $t("session.detail_page.title_interface_settings") }}</h3>
        <FormCheckbox
          :field="displayLiveTranscriptionField"
          switchDisplay
          v-model="displayLiveTranscriptionField.value" />
        <FormCheckbox
          :field="displaySubtitlesField"
          switchDisplay
          v-model="displaySubtitlesField.value" />

        <FormInput
          :field="fontSizeField"
          v-model="fontSizeField.value"
          v-if="displaySubtitlesField.value" />
      </div>
    </template>

    <div class="relative flex flex1 col">
      <!-- <SessionNotStarted v-if="isPending" /> -->

      <Loading v-if="!sessionLoaded || !selectedChannel" />

      <SessionEnded
        v-else-if="isTerminated"
        :session="session"
        :isFromPublicLink="isFromPublicLink" />

      <SessionLiveContent
        v-else
        :selectedTranslations="selectedTranslations"
        :organizationId="organizationId"
        :fontSize="fontSizeField.value"
        :displaySubtitles="displaySubtitlesField.value"
        :displayLiveTranscription="displayLiveTranscriptionField.value"
        :session="session"
        :selectedChannel="selectedChannel" />
    </div>
  </MainContent>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import EMPTY_FIELD from "@/const/emptyField"

import { sessionMixin } from "@/mixins/session.js"
import { orgaRoleMixin } from "@/mixins/orgaRole"

import MainContent from "@/components/MainContent.vue"
import SessionNotStarted from "@/components/SessionNotStarted.vue"
import SessionChannelsSelector from "@/components/SessionChannelsSelector.vue"
import SessionTranslationSelection from "@/components/SessionTranslationSelection.vue"
import SessionLiveContent from "@/components/SessionLiveContent.vue"
import Loading from "@/components/Loading.vue"
import FormInput from "@/components/FormInput.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"
import SessionEnded from "@/components/SessionEnded.vue"
import SessionStatus from "@/components/SessionStatus.vue"

export default {
  mixins: [sessionMixin, orgaRoleMixin],
  props: {},
  data() {
    const { subtitles, liveTranscription = "true" } = this.$route.query

    return {
      selectedChannel: null,
      selectedTranslations: null,
      fontSizeField: {
        ...EMPTY_FIELD,
        value: "40",
        label: this.$t("session.detail_page.font_size_label"),
        type: "number",
        customParams: {
          min: 12,
          max: 68,
        },
      },
      displaySubtitlesField: {
        ...EMPTY_FIELD,
        value: subtitles === "true",
        label: this.$t("session.detail_page.display_subtitles_label"),
      },
      displayLiveTranscriptionField: {
        ...EMPTY_FIELD,
        value: liveTranscription === "true",
        label: this.$t("session.detail_page.display_live_transcription_label"),
      },
    }
  },
  created() {
    // TODO:
    // if not started, redirect to home
    // if stopped, redirect to conversation
  },
  mounted() {},
  watch: {
    sessionLoaded() {
      if (this.sessionLoaded) {
        this.selectedChannel = this.channels[0]
        this.selectedTranslations = "original"
      }
    },
    "displaySubtitlesField.value"(value) {
      this.updateUrl()
    },
    "displayLiveTranscriptionField.value"(value) {
      this.updateUrl()
    },
    selectedChannel() {
      this.selectedTranslations = "original"
    },
  },
  methods: {
    updateUrl() {
      // add liveTranscription and subtitles to url and selectedChannel
      history.pushState(
        {},
        "",
        `${this.$route.path}?subtitles=${this.displaySubtitlesField.value}&liveTranscription=${this.displayLiveTranscriptionField.value}`,
      )
    },
  },
  components: {
    Fragment,
    MainContent,
    SessionNotStarted,
    SessionChannelsSelector,
    SessionTranslationSelection,
    SessionLiveContent,
    Loading,
    FormInput,
    FormCheckbox,
    SessionEnded,
    SessionStatus,
  },
}
</script>
