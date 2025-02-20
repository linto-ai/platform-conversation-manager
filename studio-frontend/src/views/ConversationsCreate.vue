<template>
  <MainContent sidebar box>
    <template v-slot:breadcrumb-actions> </template>

    <div class="flex col flex1">
      <Tabs
        v-model="currentTab"
        :tabs="mainTabs"
        squareTabs
        :disabled="formState === 'sending'" />

      <form
        v-if="
          currentTab !== 'session' &&
          currentTab !== 'live' &&
          currentTab !== 'visio'
        "
        class="flex col flex1"
        @submit="createConversation"
        :disabled="formState === 'sending'">
        <div class="flex col gap-small">
          <ConversationCreateAudio
            class="flex1"
            :disabled="formState === 'sending'"
            v-model="audioFiles" />
        </div>
        <!-- rights -->
        <section>
          <h2>{{ $t("conversation.conversation_creation_right_title") }}</h2>
          <div class="form-field flex col">
            <label class="form-label">
              {{ $t("conversation.conversation_creation_right_label") }}
            </label>
            <select v-model="membersRight.value">
              <option
                v-for="uright in membersRight.list"
                :key="uright.value"
                :value="uright.value">
                {{ uright.txt }}
              </option>
            </select>
          </div>
        </section>

        <!-- services -->
        <section class="flex col gap-small">
          <h2>{{ $t("conversation.transcription_service_title") }}</h2>
          <div class="error-field" v-if="fieldTranscriptionService.error">
            {{ fieldTranscriptionService.error }}
          </div>
          <ConversationCreateServices
            :serviceList="fieldTranscriptionService.list"
            :disabled="formState === 'sending'"
            :loading="fieldTranscriptionService.loading"
            v-model="fieldTranscriptionService.value" />
        </section>

        <div
          class="flex gap-small align-center conversation-create-footer"
          style="margin-top: 1rem">
          <div class="error-field flex1" v-if="formError">{{ formError }}</div>
          <div v-else class="flex1"></div>
          <button
            type="submit"
            class="btn green upload-media-button"
            id="upload-media-button"
            :disabled="formState === 'sending'">
            <span class="icon apply"></span>
            <span class="label">{{ formSubmitLabel }}</span>
          </button>
        </div>
      </form>

      <QuickSessionCreateContent
        v-if="currentTab === 'live' && !loadingSessionData"
        :transcriberProfiles="transcriberProfilesQuickMeeting"
        :currentOrganizationScope="currentOrganizationScope"
        :transcriptionServices="fieldTranscriptionService.list" />

      <VisioCreateContent
        v-if="currentTab === 'visio' && !loadingSessionData"
        :transcriberProfiles="transcriberProfilesQuickMeeting"
        :transcriptionServices="fieldTranscriptionService.list"
        :currentOrganizationScope="currentOrganizationScope" />

      <SessionCreateContent
        v-if="currentTab === 'session' && !loadingSessionData"
        :sessionTemplates="sessionTemplates"
        :transcriberProfiles="transcriberProfiles"
        :currentOrganizationScope="currentOrganizationScope" />
    </div>
  </MainContent>
</template>
<script>
import { getEnv } from "@/tools/getEnv.js"

import ConversationCreateMixin from "@/mixins/conversationCreate.js"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { organizationPermissionsMixin } from "@/mixins/organizationPermissions.js"

import {
  apiGetTranscriberProfiles,
  apiGetSessionTemplates,
  apiGetQuickSessionByOrganization,
} from "@/api/session.js"
import { testService } from "@/tools/fields/testService.js"

import ConversationCreateAudio from "@/components/ConversationCreateAudio.vue"
import ConversationCreateServices from "@/components/ConversationCreateServices.vue"
import MainContent from "@/components/MainContent.vue"
import Checkbox from "@/components/Checkbox.vue"
import Tabs from "@/components/Tabs.vue"
import SessionCreateContent from "@/components/SessionCreateContent.vue"
import ConversationCreateLink from "@/components/ConversationCreateLink.vue"
import QuickSessionCreateContent from "@/components/QuickSessionCreateContent.vue"
import VisioCreateContent from "@/components/VisioCreateContent.vue"
import TabsVertical from "@/components/TabsVertical.vue"
import ConversationCreateFileLine from "@/components/ConversationCreateFileLine.vue"

export default {
  mixins: [
    ConversationCreateMixin,
    orgaRoleMixin,
    organizationPermissionsMixin,
  ],
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
    currentOrganizationScope: {
      type: String,
      required: true,
    },
    // userOrganizations: {
    //   type: Array,
    //   required: true,
    // },
  },
  data() {
    return {
      currentTab: null,
      transcriberProfiles: [],
      sessionTemplates: [],
      loadingTranscriberProfiles: true,
      loadingQuickSession: true,
      loadingSessionTemplates: true,
    }
  },
  mounted() {
    this.fetchProfiles()
    this.fetchSessionTemplates()
  },
  async created() {
    if (this.mainTabs.length > 0) {
      this.currentTab = this.mainTabs[0].name
    } else {
      this.$router.push({ name: "not_found" })
    }
  },
  computed: {
    transcriberProfilesQuickMeeting() {
      return this.transcriberProfiles.filter((t) => t.quickMeeting)
    },
    canUploadFiles() {
      return this.canUploadInCurrentOrganization
    },
    canCreateSession() {
      const enableSession = getEnv("VUE_APP_ENABLE_SESSION") === "true"

      return enableSession && this.canSessionInCurrentOrganization
    },
    loadingSessionData() {
      return (
        this.loadingTranscriberProfiles ||
        this.loadingSessionTemplates ||
        this.fieldTranscriptionService.loading
      )
    },
    mainTabs() {
      let res = []
      if (this.canUploadFiles) {
        res.push(
          {
            name: "file",
            label: "Media",
            icon: "file-audio",
            img: "/img/We10X-icon-theme/audio-x-generic.svg",
          },
          // {
          //   name: "microphone",
          //   label: this.$i18n.t("conversation_creation.tabs.microphone"),
          //   icon: "record",
          //   img: "/img/We10X-icon-theme/vocal.svg",
          // },
          // {
          //   name: "url",
          //   label: this.$i18n.t("conversation_creation.tabs.url"),
          //   icon: "link",
          // },
        )
      }

      if (this.canCreateSession) {
        const loading = this.loadingSessionData
        if (this.isAtLeastQuickMeeting) {
          res.push({
            name: "live",
            label: this.$t("conversation_creation.tabs.quick_meeting"),
            icon: loading ? "loading" : "record-live",
            disabled:
              this.transcriberProfilesQuickMeeting.length === 0 || loading,
          })
          res.push({
            name: "visio",
            label: this.$t("conversation_creation.tabs.visio"),
            icon: loading ? "loading" : "visio",
            disabled:
              this.transcriberProfilesQuickMeeting.length === 0 || loading,
          })
        }
        if (this.isAtLeastMeetingManager) {
          res.push({
            name: "session",
            label: this.$i18n.t("conversation_creation.tabs.session"),
            icon: loading ? "loading" : "session",
            disabled: this.transcriberProfiles.length === 0 || loading,
          })
        }
      }

      return res
    },
  },
  methods: {
    createConversation(event) {
      event?.preventDefault()
      switch (this.currentTab) {
        case "url":
        //this.createConversationByUrl()
        //break
        case "file":
        case "microphone":
          this.createConversationByFile()
          break
        default:
          console.error("Unknown tab", this.currentTab)
          break
      }
      return false
    },
    async fetchProfiles() {
      const res = await apiGetTranscriberProfiles()
      this.transcriberProfiles = res
      this.loadingTranscriberProfiles = false
    },
    async fetchSessionTemplates() {
      const res = await apiGetSessionTemplates(this.currentOrganizationScope)
      this.sessionTemplates = res
      this.loadingSessionTemplates = false
    },
    async fetchQuickSession() {
      const alreadyCreatedPersonalSession =
        await apiGetQuickSessionByOrganization(this.currentOrganizationScope)

      if (alreadyCreatedPersonalSession) {
        this.currentQuickSession = alreadyCreatedPersonalSession
      }

      this.loadingQuickSession = false
    },
  },
  components: {
    ConversationCreateAudio,
    ConversationCreateServices,
    ConversationCreateLink,
    MainContent,
    Checkbox,
    Tabs,
    SessionCreateContent,
    QuickSessionCreateContent,
    VisioCreateContent,
    TabsVertical,
    ConversationCreateFileLine,
  },
}
</script>
