<template>
  <form @submit="createSession">
    <section>
      <div class="form-field flex col">
        <label for="type-visio-selector">
          {{ visioTypeField.label }}
        </label>
        <select v-model="visioTypeField.value" id="type-visio-selector">
          <option
            v-for="service in supportedVisioServices"
            :key="service"
            :value="service">
            {{ service }}
          </option>
        </select>
      </div>

      <FormInput
        :field="visioLinkField"
        v-model="visioLinkField.value"
        class="fullwidth"
        placeholder="Jitsi link"
        required />
    </section>

    <QuickSessionSettings
      :transcriberProfiles="transcriberProfiles"
      :transcriptionServices="transcriptionServices"
      :field="quickSessionSettingsField"
      source="visio"
      v-model="quickSessionSettingsField.value" />

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
</template>
<script>
import { bus } from "@/main.js"

import EMPTY_FIELD from "@/const/emptyField.js"
import { testVisioUrl } from "@/tools/fields/testVisioUrl"
import { formsMixin } from "@/mixins/forms.js"
import generateServiceConfig from "@/tools/generateServiceConfig"
import {
  apiCreateQuickSession,
  apiStartBot,
  apiDeleteQuickSession,
} from "@/api/session.js"
import { testQuickSessionSettings } from "@/tools/fields/testQuickSessionSettings"

import FormInput from "@/components/FormInput.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"
import TranscriberProfileSelector from "@/components/TranscriberProfileSelector.vue"
import QuickSessionSettings from "@/components/QuickSessionSettings.vue"

export default {
  mixins: [formsMixin],
  props: {
    transcriberProfiles: {
      type: Array,
      required: true,
    },
    currentOrganizationScope: {
      type: String,
      required: true,
    },
    transcriptionServices: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      fields: ["visioLinkField", "quickSessionSettingsField"],
      visioTypeField: {
        ...EMPTY_FIELD,
        value: "jitsi",
        label: this.$i18n.t("quick_session.setup_visio.type_label"),
      },
      visioLinkField: {
        ...EMPTY_FIELD,
        value: "",
        customParams: { placeholder: "https://meet.jit.si/..." },
        label: this.$i18n.t("quick_session.setup_visio.link_label"),
        testField: testVisioUrl,
      },
      quickSessionSettingsField: {
        ...EMPTY_FIELD,
        value: {
          keepAudio: true,
          diarization: false,
          subInStudio: false,
          subInVisio: true,
          offlineTranscription: false,
          selectedProfile: this.transcriberProfiles?.[0] ?? null,
          transcriptionService:
            this.transcriptionServices.length > 0
              ? generateServiceConfig(this.transcriptionServices[0])
              : null,
        },
        testField: testQuickSessionSettings,
      },
      supportedVisioServices: ["jitsi", "bigbluebutton"],
      formSubmitLabel: this.$t("quick_session.setup_visio.join_meeting"),
      formError: null,
      formState: "idle",
    }
  },
  mounted() {},
  methods: {
    async createSession(event) {
      event?.preventDefault()

      if (this.testFields()) {
        const settings = this.quickSessionSettingsField.value
        const channels = [
          {
            name: "Main",
            transcriberProfileId: settings.selectedProfile.id,
            translations: settings.selectedProfile.translations ?? [],
            diarization: settings.diarization ?? false,
            keepAudio: settings.keepAudio,
            async: settings.offlineTranscription,
            meta: {
              transcriptionService: settings.transcriptionService,
            },
          },
        ]
        const requestSession = await apiCreateQuickSession(
          this.currentOrganizationScope,
          {
            channels: channels,
          },
        )

        if (requestSession.status == "success") {
          const session = requestSession.data

          const requestBot = await apiStartBot({
            url: this.visioLinkField.value,
            channelId: session.channels[0].id,
            enableLiveTranscripts: settings.subInStudio,
            enableDisplaySub: settings.subInVisio,
            subSource: null,
            provider: this.visioTypeField.value,
          })
          if (requestBot.status == "success") {
            this.$router.push({
              name: "quick session",
              query: {},
              params: {
                organizationId: this.currentOrganizationScope,
              },
            })
          } else {
            await apiDeleteQuickSession(
              this.currentOrganizationScope,
              requestSession.data.id,
              { trash: true, force: true },
            )
            this.formState = "error"
          }
        } else {
          this.formState = "error"
        }
      }
    },
  },
  trashSession() {
    return
  },
  components: {
    FormInput,
    FormCheckbox,
    TranscriberProfileSelector,
    QuickSessionSettings,
  },
}
</script>
