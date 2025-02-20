import debounce from "debounce"
import { bus } from "@/main.js"

import { apiGetTranscriptionService } from "@/api/service"
import { apiCreateConversation } from "@/api/conversation"
import { getUserRoleInOrganization } from "@/tools/getUserRoleInOrganization"
import { testFieldEmpty } from "@/tools/fields/testEmpty.js"
import { testService } from "@/tools/fields/testService.js"

import { formsMixin } from "@/mixins/forms.js"
import { debounceMixin } from "@/mixins/debounce"

import RIGHTS_LIST from "@/const/rigthsList"
import EMPTY_FIELD from "@/const/emptyField"
import generateServiceConfig from "../tools/generateServiceConfig"

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
        "conversation.conversation_creation_button.create",
      ),
      formState: "available",
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
    // "$i18n.locale": {
    //   handler(value) {
    //     this.conversationLanguage.value = value.split("-")[0]
    //   },
    //   immediate: true,
    // },
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
    getTranscriptionList(lang, signal) {
      return apiGetTranscriptionService(lang, signal)
    },
    async initTranscriptionList() {
      this.transcriptionService.loading = true
      this.transcriptionService.value = null

      const transcriptionService = await this.debouncedSearch(
        this.getTranscriptionList.bind(this),
        "*",
      )

      if (transcriptionService) {
        this.transcriptionService.list = [...transcriptionService]
        this.transcriptionService.loading = false
        this.transcriptionService.value =
          transcriptionService.length > 0
            ? generateServiceConfig(transcriptionService[0])
            : null
      }
    },
    async createConversationByFile(event) {
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
            "conversation.conversation_creation_button.sending",
          )
          // scroll to top of the main element
          document.querySelector("main").scrollTo(0, 0)
          let audioFileIndex = 0
          let total = this.audioFiles.length
          while (this.audioFiles.length > 0) {
            audioFileIndex++

            const { value: convName, file, uploadType } = this.audioFiles[0]

            bus.$emit("app_notif", {
              status: "loading",
              message: this.$i18n.t(
                "conversation.conversation_creation_loading_multiple",
                { count: audioFileIndex, total: total },
              ),
              timeout: -1,
              cantBeClosed: true,
            })

            let conversationHasBeenCreated = await apiCreateConversation(
              this.currentOrganizationScope,
              {
                name: convName,
                description: "",
                membersRight: this.organizationMemberAccess
                  ? parseInt(this.membersRight.value)
                  : 0,
                serviceName: this.transcriptionService.value.serviceName,
                transcriptionConfig: JSON.stringify(
                  this.transcriptionService.value.config,
                ),
                segmentCharSize: process.env.VUE_APP_TURN_SIZE,
                lang: this.transcriptionService.value.lang,
                endpoint: this.transcriptionService.value.endpoint,
                tracks: uploadType == "url" ? null : [file],
                url: uploadType == "url" ? file : null,
              },
              null,
              (progressEvent) => {
                try {
                  const { loaded, total } = progressEvent
                  this.audioFiles[0].progress = Math.floor(
                    (loaded * 100) / total,
                  )
                } catch (error) {
                  this.audioFiles[0].progress = -1
                }
              },
            )

            if (!conversationHasBeenCreated) {
              this.emitError(
                this.$i18n.t(
                  "conversation.conversation_creation_error_multiple_unknown",
                  {
                    count: audioFileIndex - 1,
                    total: total,
                  },
                ),
              )
              this.formSubmitLabel = this.$i18n.t(
                "conversation.conversation_creation_button.retry",
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
              cantBeClosed: true,
            })
          }
        } else {
          this.formError = this.$i18n.t("conversation.error.form_invalid")
        }
      }
      return false
    },
    async createConversationByUrl(event) {
      if (this.formState === "available") {
        if (
          this.testFields({
            fieldsToTest: ["linkFields", "transcriptionService"],
          })
        ) {
          this.formError = null
          this.formState = "sending"
          this.formSubmitLabel = this.$i18n.t(
            "conversation.conversation_creation_button.sending",
          )

          const convName = this.linkFields[2].value

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
                this.transcriptionService.value.config,
              ),
              segmentCharSize: process.env.VUE_APP_TURN_SIZE,
              lang: this.transcriptionService.value.lang,
              endpoint: this.transcriptionService.value.endpoint,
              url: this.linkFields[0].value,
            },
          )

          if (conversationHasBeenCreated) {
            this.formState = "success"
            bus.$emit("set_organization_scope", {
              organizationId: this.conversationOrganization.value,
            })
            bus.$emit("app_notif", {
              status: "success",
              message: this.$i18n.t("conversation.creation_success_message"),
              redirect: false,
              cantBeClosed: true,
            })
          } else {
            this.emitError(
              this.$i18n.t("conversation.conversation_creation_error_unknown"),
            )
            this.formSubmitLabel = this.$i18n.t(
              "conversation.conversation_creation_button.retry",
            )
            this.formState = "available"
          }
        }
      }
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
}
