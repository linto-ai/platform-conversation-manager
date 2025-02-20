<template>
  <!-- TODO: Merge with serviceBox component ? -->
  <fieldset
    @click="select"
    class="flex col selectable"
    :selected="selected"
    role="option"
    aria-selected="selected"
    :id="`service-${value.name}`">
    <!-- add a form tag all around ?-->
    <!-- <legend class="h3">{{ value.name }}</legend> -->
    <h4 class="flex align-center service-box__title">
      <!-- <span class="icon apply" v-if="alreadyGenerated"></span> -->
      <span class="flex1">{{ description }}</span>
      <!-- <img class="icon large" :src="icon" :black="disabled" /> -->
    </h4>

    <div class="form-field flex col small-padding-top">
      <div>
        <label>{{ $t("conversation.acoustic_label") }}</label>
        {{ acoustic_value[value.accoustic] }}
      </div>

      <!-- <div>
        <label>{{ $t("conversation.language_label") }}</label>
        {{ language_formatted }}
      </div> -->

      <div>
        <label>{{ $t("conversation.model_quality_label") }}</label>
        {{ audio_quality_value[value.model_quality] }}
      </div>
    </div>

    <!-- -- -- language -- -- -->
    <!-- todo: reactivate lang selector when supported by api-->
    <div
      class="form-field flex col"
      v-if="false && isWhisper && language === '*'">
      <label :for="`service-${value.name}-language`">
        {{ $t("conversation.transcription.language_label") }}
      </label>
      <select
        v-model="languageField.value"
        :id="`service-${value.name}-language`">
        <option value="*">{{ this.$i18n.t("lang.automatic") }}</option>
        <option value="fr">{{ this.$i18n.t("lang.fr") }}</option>
        <option value="en">{{ this.$i18n.t("lang.en") }}</option>
      </select>
    </div>

    <LabeledValue
      v-else
      selectLike
      :label="$t('conversation.transcription.language_label')"
      :value="language_formatted"></LabeledValue>

    <!-- -- -- punctuation  -- -- -->
    <div class="form-field flex col" v-if="isModelWithPunctuation">
      <label :for="`service-${value.name}-punctuation`">
        {{ $t("conversation.transcription.punctuation_label") }}
      </label>
      <select
        v-model="punctuation.value"
        :id="`service-${value.name}-punctuation`">
        <option value="disabled">
          {{ $t("conversation.transcription.punctuation_disabled") }}
        </option>
        <option
          v-for="punctuationService of value.sub_services.punctuation"
          :key="punctuationService.service_name"
          :value="punctuationService.service_name">
          {{ extract_locales(punctuationService.info) }}
        </option>
      </select>
    </div>
    <LabeledValue
      v-else
      selectLike
      :label="$t('conversation.transcription.punctuation_label')"
      :value="
        $t('conversation.transcription.punctuation_value_whisper')
      "></LabeledValue>

    <!-- -- -- diarization -- -- -->
    <div class="form-field flex col">
      <label :for="`service-${value.name}-diarization`">
        {{ $t("conversation.transcription.diarization_label") }}
      </label>
      <select
        v-model="diarization.value"
        :id="`service-${value.name}-diarization`"
        v-if="!multiTrack">
        <option value="disabled">
          {{ $t("conversation.transcription.diarization_disabled") }}
        </option>
        <option
          v-for="diarizationService of value.sub_services.diarization"
          :key="diarizationService.service_name"
          :value="diarizationService.service_name">
          {{ extract_locales(diarizationService.info) }}
        </option>
      </select>
      <select
        v-model="diarization.value"
        :id="`service-${value.name}-diarization`"
        v-else>
        <option value="disabled">One speaker per file</option>
      </select>
    </div>

    <div class="form-field flex col" v-if="diarization.value !== 'disabled'">
      <label :for="`service-${value.name}-speakers`">
        {{ $t("conversation.transcription.number_of_speaker_label") }}
      </label>
      <input
        type="number"
        :disabled="diarization.value === 'disabled'"
        placeholder="auto (experimental)"
        v-model="speakersNumber.value"
        :id="`service-${value.name}-speakers`"
        min="0" />
    </div>
    <div class="flex1"></div>
  </fieldset>
</template>
<script>
import EMPTY_FIELD from "../const/emptyField"
import ACOUSTIC from "../const/acoustic"
import AUDIO_QUALITY from "../const/audioQuality"
import LabeledValue from "./LabeledValue.vue"
import generateServiceConfig from "../tools/generateServiceConfig"

export default {
  props: {
    value: {
      required: false,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    selected: {
      type: Boolean,
      required: false,
      default: false,
    },
    multiTrack: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      diarization: { ...EMPTY_FIELD, value: "disabled" },
      punctuation: { ...EMPTY_FIELD, value: "disabled" },
      speakersNumber: { ...EMPTY_FIELD, value: "auto" },
      acoustic_value: ACOUSTIC((key) => this.$i18n.t(key)),
      audio_quality_value: AUDIO_QUALITY((key) => this.$i18n.t(key)),
      languageField: { ...EMPTY_FIELD, value: "*" },
    }
  },
  computed: {
    description() {
      return this.extract_locales(this.value.desc)
    },
    modelType() {
      return this.value.model_type
    },
    isModelWithPunctuation() {
      return this.modelType !== "whisper"
    },
    isWhisper() {
      return this.modelType === "whisper"
    },
    language() {
      return this.value?.language || "*"
    },
    language_formatted() {
      if (!this.value.language) {
        return this.$i18n.t("lang.automatic")
      }

      let languageNames = new Intl.DisplayNames([this.$i18n.locale], {
        type: "language",
      })

      return languageNames.of(this.value.language)
    },
  },
  watch: {
    "diarization.value"() {
      this.select(null)
    },
    "punctuation.value"() {
      this.select(null)
    },
    "speakersNumber.value"() {
      this.select(null)
    },
    multiTrack() {
      this.diarization.value = "disabled"
    },
  },
  methods: {
    removeLeadingSlash(str) {
      return str.replace(/^\/+/, "")
    },
    extract_locales(value) {
      const lang = this.$i18n.locale.split("-")[0] || "en"
      return value[lang] || value["en"]
    },

    select(event) {
      event?.preventDefault()
      this.$emit(
        "select",
        generateServiceConfig(this.value, {
          punctuationValue: this.punctuation.value,
          diarizationValue: this.diarization.value,
          speakersNumberValue: this.speakersNumber.value,
          languageValue: this.isWhisper
            ? this.languageField.value
            : this.value.language,
        }),
      )
    },
  },
  components: { LabeledValue },
}
</script>
