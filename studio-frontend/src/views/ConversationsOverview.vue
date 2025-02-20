<template>
  <MainContentConversation
    box
    :conversation="conversation"
    :status="status"
    :dataLoaded="dataLoaded"
    :error="error">
    <template v-slot:breadcrumb-actions v-if="conversation">
      <router-link :to="conversationListRoute" class="btn secondary">
        <span class="icon close"></span>
        <span class="label">{{
          $t("conversation_overview.close_overview")
        }}</span>
      </router-link>
      <h1
        class="flex1 center-text text-cut"
        style="padding-left: 1rem; padding-right: 1rem">
        {{ name }}
      </h1>
      <div class="flex row conversation-actions gap-small">
        <router-link
          :to="`/interface/conversations/${rootConversation._id}/transcription`"
          class="btn green"
          :is="status !== 'done' ? 'span' : 'router-link'"
          :disabled="status !== 'done'">
          <span class="icon conv-list"></span>
          <span class="label">{{
            $t("conversation.transcription_label")
          }}</span>
        </router-link>
      </div>
    </template>
    <h1 class="center-text conversation-overview-h1">
      {{ $t("conversation_overview.title") }}
    </h1>
    <div class="flex gap-medium" v-if="conversation">
      <!-- LEFT COLUMN -->
      <div class="flex col flex1">
        <ConversationOverviewMainInfos
          :conversation="conversation"
          :rootConversation="rootConversation"
          :channels="channels"
          :canEdit="userRights.hasRightAccess(userRight, userRights.WRITE)" />
        <ConversationOverviewRights
          :conversation="rootConversation"
          :currentOrganizationScope="currentOrganizationScope"
          :userInfo="userInfo" />
      </div>
      <ConversationOverviewLinks
        :conversation="rootConversation"></ConversationOverviewLinks>
    </div>

    <section v-if="conversation">
      <h2>{{ $t("conversation_overview.channel.title") }}</h2>
      <div v-if="tabs.length == 0">
        {{ $t("conversation_overview.channel.only_one") }}
      </div>
      <Tabs :tabs="tabs" v-model="selectedChannel" secondary></Tabs>
      <div class="tab-container-content" :key="conversation._id">
        <ConversationOverviewChannel
          :root="tabs.length == 0"
          :conversation="conversation"
          @update_channel_name="updateChannelName" />
      </div>
    </section>
  </MainContentConversation>
</template>
<script>
import { bus } from "../main.js"

import { getEnv } from "@/tools/getEnv"
import RIGHTS_LIST from "@/const/rigthsList.js"
import { conversationMixin } from "@/mixins/conversation.js"
import { debounceMixin } from "@/mixins/debounce.js"
import { timeToHMS } from "@/tools/timeToHMS"

import Loading from "@/components/Loading.vue"
import CollaborativeField from "@/components/CollaborativeField.vue"
import MainContentConversation from "@/components/MainContentConversation.vue"
import ConversationOverviewMainInfos from "@/components/ConversationOverviewMainInfos.vue"
import ConversationOverviewMetadata from "@/components/ConversationOverviewMetadata.vue"
import ConversationOverviewLinks from "@/components/ConversationOverviewLinks.vue"
import ConversationOverviewRights from "@/components/ConversationOverviewRights.vue"
import Tabs from "@/components/Tabs.vue"
import ConversationOverviewChannel from "@/components/ConversationOverviewChannel.vue"

export default {
  props: {
    currentOrganizationScope: { type: String, required: true },
    userInfo: { type: Object, required: true },
  },
  mixins: [conversationMixin, debounceMixin],
  data() {
    return {
      selfUrl: (convId) => `/interface/conversations/${convId}`,
      conversationId: "",
      membersRight: {
        value: 1,
        error: null,
        valid: true,
      },
      rigthsList: RIGHTS_LIST((key) => this.$i18n.t(key)),
      status: null,
      loadingAudio: false,
    }
  },
  mounted() {},
  watch: {
    dataLoaded(data) {
      if (data) {
        this.status = this.computeStatus(this.conversation?.jobs?.transcription)
      }
    },
  },
  computed: {
    tabs() {
      let tabs = []
      for (const channel of this.channels) {
        //let nameBefore = channel.name
        //const nameSplit = channel.name.split("-")
        //const nameFinal = nameSplit.length > 1 ? nameSplit[1] : nameSplit[0]
        tabs.push({
          name: channel._id,
          label: channel.name.trim(),
          id: channel._id,
        })
      }
      return structuredClone(tabs)
    },
    dataLoaded() {
      return this.conversationLoaded
    },
    keywordExtractorStatus() {
      return this.conversation?.jobs?.keyword?.state || "none"
    },
    conversationListRoute() {
      return { name: "inbox", hash: "#previous" }
    },
    fileName() {
      return this.conversation?.metadata?.audio?.filename
    },
    duration() {
      return timeToHMS(this.conversation?.metadata?.audio?.duration)
    },
    linkToMedia() {
      const BASE_API = getEnv("VUE_APP_CONVO_API")
      return `${BASE_API}/conversations/${this.conversationId}/media`
    },
  },
  methods: {
    updateChannelName({ id, newName }) {
      this.tabs.find((t) => (t.id = id)).label = newName
    },
    updateConversationName() {
      bus.$emit("update_conversation_name", {})
    },
    async downloadAudio() {
      this.loadingAudio = true
      await this.getAudioFile()
      const link = document.createElement("a")
      link.href = this.audioFile
      link.download = this.fileName + ".mp3"
      link.click()
      URL.revokeObjectURL(link.href)
      this.loadingAudio = false
    },
  },
  components: {
    CollaborativeField,
    Loading,
    MainContentConversation,
    ConversationOverviewMainInfos,
    ConversationOverviewMetadata,
    ConversationOverviewLinks,
    ConversationOverviewRights,
    ConversationOverviewChannel,
    Tabs,
  },
}
</script>
