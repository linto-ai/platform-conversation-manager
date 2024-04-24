<template>
  <MainContent sidebar box>
    <ConversationHelper
      :showHelper="helperVisible"
      @close="closeHelper()"></ConversationHelper>

    <template v-slot:breadcrumb-actions>
      <button class="btn" @click="showHelper()" style="min-width: 80px">
        <span class="icon help"></span>
        <span class="label">{{
          $t("conversation.transcription_help.help_button_label")
        }}</span>
      </button>
    </template>

    <div class="flex row">
      <form
        class="flex col flex1"
        @submit="createConversation"
        :disabled="formState === 'sending'">
        <section>
          <h2>{{ $t("conversation.media_title") }}</h2>
          <ConversationCreateAudio
            :disabled="formState === 'sending'"
            v-model="audioFiles" />

          <div class="flex col form-field">
            <div class="flex row align-center form-label">
              <input
                type="checkbox"
                v-model="organizationMemberAccess"
                id="organizationMemberAccess"
                :disabled="formState === 'sending'" />
              <label
                for="organizationMemberAccess"
                class="no-padding no-margin">
                {{ $t("conversation.members_right_label") }}
              </label>
            </div>
            <select
              v-model="membersRight.value"
              v-if="organizationMemberAccess"
              :disabled="formState === 'sending'">
              <option
                v-for="right in membersRight.list"
                :key="right.value"
                :value="right.value">
                {{ right.txt }}
              </option>
            </select>
          </div>
        </section>

        <section>
          <h2>{{ $t("conversation.transcription_service_title") }}</h2>
          <div class="error-field" v-if="transcriptionService.error">
            {{ transcriptionService.error }}
          </div>
          <div class="form-field flex row">
            <div class="flex col">
              <label class="form-label" for="conversationName">
                {{ $t("conversation.language_label") }}
              </label>
              <select
                :disabled="formState === 'sending'"
                v-model="conversationLanguage.value">
                <option
                  v-for="lang of languages"
                  :key="lang.value"
                  :value="lang.value">
                  {{ lang.label }}
                </option>
              </select>
            </div>
          </div>
          <ConversationCreateServices
            :serviceList="transcriptionService.list"
            :disabled="formState === 'sending'"
            :loading="transcriptionService.loading"
            v-model="transcriptionService.value" />
        </section>

        <!-- Submit -->
        <div class="flex col gap-small align-top" style="margin-top: 1rem">
          <div class="error-field" v-if="formError">{{ formError }}</div>
          <button
            type="submit"
            class="btn green"
            :disabled="formState === 'sending'">
            <span class="icon apply"></span>
            <span class="label">{{ formSubmitLabel }}</span>
          </button>
        </div>
      </form>
    </div>
  </MainContent>
</template>
<script>
import debounce from "debounce"

import { bus } from "@/main.js"
import { apiGetTranscriptionService } from "@/api/service"
import { apiCreateConversation } from "@/api/conversation"
import { getUserRoleInOrganization } from "@/tools/getUserRoleInOrganization"
import { testFieldEmpty } from "@/tools/fields/testEmpty.js"
import { testService } from "@/tools/fields/testService.js"

import { formsMixin } from "@/mixins/forms.js"
import { debounceMixin } from "@/mixins/debounce"

import ConversationHelper from "@/components/ConversationHelper.vue"
import ConversationCreateAudio from "@/components/ConversationCreateAudio.vue"
import ConversationCreateServices from "@/components/ConversationCreateServices.vue"
import MainContent from "@/components/MainContent.vue"

import RIGHTS_LIST from "@/const/rigthsList"
import EMPTY_FIELD from "@/const/emptyField"

export default {
  mixins: [formsMixin, debounceMixin],
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
    currentOrganizationScope: {
      type: String,
      required: true,
    },
    userOrganizations: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      //conversationName: { ...EMPTY_FIELD },
      //conversationDescription: { ...EMPTY_FIELD },
      fields: [
        "audioFiles",
        "conversationOrganization",
        "membersRight",
        "transcriptionService",
        "conversationLanguage",
      ],
      audioFiles: [], // array of fields { value (name), file, error }
      conversationOrganization: {
        ...EMPTY_FIELD,
        value: this.currentOrganizationScope,
        testField: testFieldEmpty,
      },
      membersRight: {
        ...EMPTY_FIELD,
        value: 1,
        list: RIGHTS_LIST((key) => this.$i18n.t(key)),
      },
      transcriptionService: {
        ...EMPTY_FIELD,
        loading: true,
        list: [],
        testField: testService,
      },
      conversationLanguage: {
        ...EMPTY_FIELD,
        value: "fr",
        valid: true,
      },
      organizationMemberAccess: true,
      formSubmitLabel: this.$i18n.t(
        "conversation.conversation_creation_button.create"
      ),
      formState: "available",
      helperVisible: false,
      languages: [
        { value: "fr", label: this.$i18n.t("lang.fr") },
        { value: "en", label: this.$i18n.t("lang.en") },
      ],
      formError: null,
      debounceGetTranscriptionService: debounce(this.initTranscriptionList, 30),
    }
  },
  async created() {
    this.conversationOrganization.value = this.currentOrganizationScope
    this.initTranscriptionList()
  },
  watch: {
    "conversationLanguage.value"(value) {
      this.initTranscriptionList()
    },
    "$i18n.locale": {
      handler(value) {
        this.conversationLanguage.value = value.split("-")[0]
      },
      immediate: true,
    },
  },
  computed: {
    organizationList() {
      return this.userOrganizations.filter((org) => {
        let role = getUserRoleInOrganization(org, this.userInfo._id)
        return role > 1
      })
    },
  },
  methods: {
    showHelper() {
      this.helperVisible = true
    },
    closeHelper() {
      this.helperVisible = false
    },
    getTranscriptionList(lang, signal) {
      return apiGetTranscriptionService(lang, signal)
    },
    async initTranscriptionList() {
      this.transcriptionService.loading = true
      this.transcriptionService.value = null

      const transcriptionService = await this.debouncedSearch(
        this.getTranscriptionList.bind(this),
        this.conversationLanguage.value
      )

      if (transcriptionService) {
        this.transcriptionService.list = [...transcriptionService]
        this.transcriptionService.loading = false
        this.transcriptionService.value = null
      }
    },
    async createConversation(event) {
      event?.preventDefault()

      if (this.audioFiles.length === 0) {
        this.formError = this.$i18n.t("conversation.error.no_audio_file")
        return
      }

      if (this.formState === "available") {
        if (this.testFields()) {
          this.formError = null
          this.formState = "sending"
          this.formSubmitLabel = this.$i18n.t(
            "conversation.conversation_creation_button.sending"
          )
          let audioFileIndex = 0
          let total = this.audioFiles.length
          while (this.audioFiles.length > 0) {
            audioFileIndex++

            const { value: convName, file } = this.audioFiles[0]

            bus.$emit("app_notif", {
              status: "loading",
              message: this.$i18n.t(
                "conversation.conversation_creation_loading_multiple",
                { count: audioFileIndex, total: total }
              ),
              timeout: -1,
            })

            let conversationHasBeenCreated = await apiCreateConversation(
              this.currentOrganizationScope,
              {
                name: convName,
                description: "",
                membersRights: this.organizationMemberAccess
                  ? parseInt(this.membersRight.value)
                  : 0,
                serviceName: this.transcriptionService.value.serviceName,
                transcriptionConfig: JSON.stringify(
                  this.transcriptionService.value.config
                ),
                segmentCharSize: process.env.VUE_APP_TURN_SIZE,
                lang: this.transcriptionService.value.lang,
                endpoint: this.transcriptionService.value.endpoint,
                tracks: [file],
              }
            )

            if (!conversationHasBeenCreated) {
              this.emitError(
                this.$i18n.t(
                  "conversation.conversation_creation_error_multiple_unknown",
                  {
                    count: audioFileIndex - 1,
                    total: total,
                  }
                )
              )
              this.formSubmitLabel = this.$i18n.t(
                "conversation.conversation_creation_button.retry"
              )
              this.formState = "available"
              return
            }
            this.audioFiles.shift()
          }

          if (this.audioFiles.length === 0) {
            this.formState = "success"
            bus.$emit("set_organization_scope", {
              organizationId: this.conversationOrganization.value,
            })
            bus.$emit("app_notif", {
              status: "success",
              message: this.$i18n.t("conversation.creation_success_message"),
              redirect: false,
            })
          }
        } else {
          this.formError = this.$i18n.t("conversation.error.form_invalid")
        }
      }
      return false
    },
    emitError(errorMessage) {
      bus.$emit("app_notif", {
        status: "error",
        message: errorMessage,
        timeout: null,
      })
    },
    getOrganizationById(id) {
      return this.userOrganizations.find((orga) => orga._id === id)
    },
  },
  components: {
    ConversationHelper,
    ConversationCreateAudio,
    ConversationCreateServices,
    MainContent,
  },
}
</script>
