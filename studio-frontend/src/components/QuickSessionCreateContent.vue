<template>
  <form @submit="createQuickSession">
    <!-- <section class="flex col gap-small">
      <h2>{{ $t("quick_session.creation.source_title") }}</h2>
      <FormRadio :field="fieldSource" v-model="fieldSource.value" />
    </section> -->
    <div>
      {{ $t("quick_session.creation.description_micro") }}
    </div>
    <!-- <section class="flex col gap-small">
      <h2>{{ $t("quick_session.creation.profile_selector_title") }}</h2>
      <FormCheckbox
        class=""
        :field="fieldDiarizationEnabled"
        v-model="fieldDiarizationEnabled.value"></FormCheckbox>
      <FormCheckbox
        :field="fieldKeepAudio"
        v-model="fieldKeepAudio.value"></FormCheckbox>
      <TranscriberProfileSelector
        :multiple="false"
        v-model="selectedProfile"
        :profilesList="transcriberProfiles" />
    </section> -->

    <QuickSessionSettings
      :transcriberProfiles="transcriberProfiles"
      :transcriptionServices="transcriptionServices"
      :field="quickSessionSettingsField"
      source="micro"
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
import EMPTY_FIELD from "@/const/emptyField"
import { testFieldEmpty } from "@/tools/fields/testEmpty"
import { testQuickSessionSettings } from "@/tools/fields/testQuickSessionSettings"
import generateServiceConfig from "@/tools/generateServiceConfig"

import { formsMixin } from "@/mixins/forms.js"

import FormRadio from "@/components/FormRadio.vue"
import TranscriberProfileSelector from "@/components/TranscriberProfileSelector.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"
import QuickSessionSettings from "@/components/QuickSessionSettings.vue"

import { apiCreateQuickSession } from "@/api/session.js"

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
      fields: ["fieldSource", "quickSessionSettingsField"],
      fieldSource: {
        value: "microphone",
        error: null,
        valid: false,
        options: [
          {
            name: "microphone",
            label: this.$i18n.t(
              "quick_session.creation.microphone_source_label",
            ),
          },
        ],
        testField: testFieldEmpty,
      },
      fieldDiarizationEnabled: {
        ...EMPTY_FIELD,
        value: false,
        label: this.$t("session.create_page.diarization_label"),
      },
      fieldKeepAudio: {
        ...EMPTY_FIELD,
        value: true,
        label: this.$t("session.create_page.keep_audio_label"),
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
      selectedProfile: this.transcriberProfiles[0],
      formSubmitLabel: this.$i18n.t("quick_session.creation.submit_button"),

      formError: null,
      formState: "idle",
    }
  },
  mounted() {},
  methods: {
    async goToQuickSession() {
      this.$router.push({
        name: "quick session",
        query: {},
        params: {
          organizationId: this.currentOrganizationScope,
        },
      })
    },
    async createQuickSession(event) {
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
        const res = await apiCreateQuickSession(this.currentOrganizationScope, {
          channels: channels,
        })

        if (res.status == "success") {
          this.$router.push({
            name: "quick session",
            query: {},
            params: {
              organizationId: this.currentOrganizationScope,
            },
          })
        } else {
          this.formState = "error"
        }
      } else {
        this.formState = "error"
      }
      return false
    },
  },
  components: {
    FormRadio,
    TranscriberProfileSelector,
    FormCheckbox,
    QuickSessionSettings,
  },
}
</script>
