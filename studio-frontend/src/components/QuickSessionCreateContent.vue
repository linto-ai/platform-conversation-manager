<template>
  <form @submit="createQuickSession">
    <!-- <section class="flex col gap-small">
      <h2>{{ $t("quick_session.creation.source_title") }}</h2>
      <FormRadio :field="fieldSource" v-model="fieldSource.value" />
    </section> -->
    <div>
      {{ $t("quick_session.creation.description") }}
    </div>
    <section class="flex col gap-small">
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
</template>
<script>
import EMPTY_FIELD from "@/const/emptyField"
import { testFieldEmpty } from "@/tools/fields/testEmpty"

import { formsMixin } from "@/mixins/forms.js"

import FormRadio from "@/components/FormRadio.vue"
import TranscriberProfileSelector from "@/components/TranscriberProfileSelector.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"

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
  },
  data() {
    return {
      fields: ["fieldSource"],
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
          // {
          //   name: "visio",
          //   label: this.$i18n.t("quick_session.creation.visio_source_label"),
          //   disabled: false,
          // },
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

      if (!this.selectedProfile) {
        this.formError = this.$i18n.t(
          "quick_session.creation.no_profile_selected_error",
        )
        this.formState = "error"
        return false
      }

      if (this.testFields()) {
        const channels = [
          {
            name: "Main",
            transcriberProfileId: this.selectedProfile.id,
            translations: this.selectedProfile.translations ?? [],
            diarization: this.fieldDiarizationEnabled.value ?? false,
            keepAudio: this.fieldKeepAudio.value,
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
  components: { FormRadio, TranscriberProfileSelector, FormCheckbox },
}
</script>
