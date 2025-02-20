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

    <section>
      <!-- <h2>Options de la transcription temps-réel</h2> -->
      <FormCheckbox
        :field="subInStudio"
        v-model="subInStudio.value"
        switchDisplay />
      <div v-if="subInStudio.value" class="subSection">
        <h3 class="small-margin-bottom">
          {{ $t("quick_session.setup_visio.live_options") }}
        </h3>
        <FormCheckbox
          :field="subInVisioField"
          v-model="subInVisioField.value" />
        <FormCheckbox
          class=""
          :field="fieldDiarizationEnabled"
          v-model="fieldDiarizationEnabled.value"></FormCheckbox>
        <FormCheckbox
          :field="fieldKeepAudio"
          v-model="fieldKeepAudio.value"></FormCheckbox>
        <div class="medium-margin-top">
          <h3>{{ $t("quick_session.creation.profile_selector_title") }}</h3>

          <TranscriberProfileSelector
            :multiple="false"
            v-model="selectedProfile"
            :profilesList="transcriberProfiles" />
        </div>
      </div>
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
import { bus } from "@/main.js"

import EMPTY_FIELD from "@/const/emptyField.js"
import { testVisioUrl } from "@/tools/fields/testVisioUrl"
import { formsMixin } from "@/mixins/forms.js"

import FormInput from "@/components/FormInput.vue"
import FormCheckbox from "@/components/FormCheckbox.vue"
import TranscriberProfileSelector from "@/components/TranscriberProfileSelector.vue"

import {
  apiCreateQuickSession,
  apiStartBot,
  apiDeleteQuickSession,
} from "@/api/session.js"

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
      fields: ["visioLinkField"],
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
      subInVisioField: {
        ...EMPTY_FIELD,
        value: true,
        label: this.$i18n.t(
          "quick_session.setup_visio.display_transcription_in_visio_label",
        ),
      },
      subInStudio: {
        ...EMPTY_FIELD,
        value: true,
        label: this.$i18n.t(
          "quick_session.setup_visio.live_transcription_label",
        ),
        disabled: true,
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
      supportedVisioServices: ["jitsi", "bigbluebutton"],
      selectedProfile: this.transcriberProfiles[0],
      formSubmitLabel: this.$t("quick_session.setup_visio.join_meeting"),

      formError: null,
      formState: "idle",
    }
  },
  mounted() {},
  methods: {
    async createSession(event) {
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
            enableLiveTranscripts: this.subInStudio.value,
            enableDisplaySub: this.subInVisioField.value,
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
  },
}
</script>
