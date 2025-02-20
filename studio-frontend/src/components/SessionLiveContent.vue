<template>
  <div class="session-content flex flex1 col" @scroll="handleScroll">
    <div class="medium-margin">
      <h1 class="center-text session-content__title">{{ title }}</h1>
    </div>
    <SessionChannel
      v-if="isConnected"
      :selectedTranslations="selectedTranslations"
      :sessionId="session.id"
      :organizationId="organizationId"
      :fontSize="fontSize"
      :channel="selectedChannel"
      :displaySubtitles="displaySubtitles"
      :displayLiveTranscription="displayLiveTranscription"
      :isBottom="isBottom"></SessionChannel>
    <Loading v-else></Loading>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import SessionWS from "@/models/SessionWS.js"

import { sessionModelMixin } from "@/mixins/sessionModel.js"
import { sessionChannelModelMixin } from "../mixins/sessionChannelModel.js"

import SessionChannel from "@/components/SessionChannel.vue"
import Loading from "@/components/Loading.vue"

export default {
  mixins: [sessionModelMixin, sessionChannelModelMixin],
  props: {
    selectedChannel: {
      type: Object,
      required: true,
    },
    session: {
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
    selectedTranslations: {
      type: String,
      required: false,
      default: "original",
    },
    customTitle: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      isConnected: false,
      isBottom: true,
      channelKeyObj: "selectedChannel",
    }
  },
  mounted() {
    this.init()
  },
  beforeDestroy() {},
  computed: {
    isInError() {
      return this.channelTranscriberStatus === "errored"
    },
    title() {
      return this.customTitle ?? this.name
    },
  },
  methods: {
    async init() {
      this.isConnected = true
    },
    handleScroll(e) {
      let isBottom =
        e.target.scrollHeight - e.target.scrollTop < e.target.clientHeight + 150
      if (isBottom !== this.isBottom) {
        this.isBottom = isBottom
      }
    },
  },
  components: { Fragment, SessionChannel, Loading },
}
</script>
