<template>
  <MainContent noBreadcrumb :organizationPage="false">
    <template v-slot:breadcrumb-actions>
      <h1
        class="flex1 center-text text-cut"
        style="padding-left: 1rem; padding-right: 1rem">
        {{ conversation.name }}
      </h1>
    </template>
    <div class="flex col flex1 gap-medium align-center conversation-status">
      <h2 class="center-text">
        {{ $t("conversation.status_page.generic_title") }}
      </h2>

      <DrawingLogo alt="people drawing" class="flex1 illustration" />

      <div class="conversation-status-line" v-if="jobState == 'started'">
        <h3 class="flex align-center">
          <span class="icon loading"></span>
          <span>{{ currentStep }}... ({{ progress }}%)</span>
        </h3>
        <progress :max="progressTotal" :value="progressValue"></progress>
      </div>

      <div v-else-if="jobState == 'pending'">
        <h3 class="flex align-center gap-small">
          <span class="icon loading"></span>
          {{ $t(`conversation.status.pending`) }}
        </h3>
      </div>

      <div>
        {{ $t("conversation.status_page.generic_description_line_1") }}
      </div>
      <div>
        {{ $t("conversation.status_page.generic_description_line_2") }}
      </div>
      <div>
        <router-link :to="conversationListRoute" class="btn">
          <span class="icon back"></span>
          <span class="label">{{
            $t("conversation.status_page.return_to_medias_list_button")
          }}</span>
        </router-link>
      </div>
    </div>
  </MainContent>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import MainContent from "./MainContent.vue"
import DrawingLogo from "@/svg/Drawing.vue"

export default {
  props: {
    conversation: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      stepKeys: [
        "preprocessing",
        "transcription",
        "diarization",
        "punctuation",
        "postprocessing",
      ],
      steps: this.conversation?.jobs?.transcription?.steps,
      jobState: this.conversation?.jobs?.transcription?.state,
    }
  },
  mounted() {
    bus.$on("job_transcription_update", () => {
      this.steps = this.conversation?.jobs?.transcription?.steps
      this.jobState = this.conversation?.jobs?.transcription?.state
    })
  },
  beforeDestroy() {
    bus.$off("job_transcription_update")
  },
  computed: {
    progress() {
      let progress = (this.progressValue / this.progressTotal) * 100
      return Math.floor(progress * 10) / 10
    },
    conversationListRoute() {
      return { name: "inbox", hash: "#previous" }
    },
    currentStep() {
      let currentStep = this.stepKeys[0]
      for (let step of this.stepKeys) {
        if (this.steps[step]?.progress != 1) {
          currentStep = step
          break
        }
      }
      return this.$t(`conversation.status.${currentStep}`)
    },
    progressTotal() {
      return Object.values(this.steps).reduce((acc, step) => {
        if (!step.required) return acc
        return acc + 100
      }, 0)
    },
    progressValue() {
      let res = Object.values(this.steps).reduce((acc, step) => {
        if (step.progress === undefined) return acc
        return acc + step.progress * 100
      }, 0)
      return res
    },
  },
  methods: {},
  components: { Fragment, MainContent, DrawingLogo },
}
</script>
