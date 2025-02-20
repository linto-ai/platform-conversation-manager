<template>
  <ModalNew
    :title="$t('conversation.subtitles.generate_subs')"
    :actionBtnLabel="$t('conversation.subtitles.generate')"
    :cancelButton="false"
    @on-cancel="() => this.$emit('on-close')"
    @on-confirm="generateSubtitles"
    small>
    <form action="">
      <FormInput :field="versionName" v-model="versionName.value" />
      <label for="splitOptions">
        {{ $t("conversation.subtitles.max_lines") }}
      </label>
      <div class="form-field">
        <CustomSelect
          id="split-options"
          :valueText="selectedOPtion.text"
          :value="selectedOPtion.value"
          :options="selectOptions"
          @input="selectionChange"></CustomSelect>
      </div>
      <FormInput :field="maxLength" v-model="maxLength.value">
        <template v-slot:content-after-label>
          <span class="form-label"> {{ `: ${maxLength.value}` }} </span>
        </template>
      </FormInput>
      <FormInput :field="maxDuration" v-model="maxDuration.value">
        <template v-slot:content-after-label>
          <span class="form-label"> {{ `: ${maxDurationLabel}` }} </span>
        </template>
      </FormInput>
    </form>
  </ModalNew>
</template>
<script>
import ModalNew from "./ModalNew.vue"
import FormInput from "@/components/FormInput.vue"
import { formsMixin } from "@/mixins/forms.js"
import { testName } from "../tools/fields/testName"
import CustomSelect from "./CustomSelect.vue"
import { workerSendMessage } from "../tools/worker-message"
export default {
  mixins: [formsMixin],
  data() {
    return {
      versionName: {
        value: "",
        error: null,
        valid: false,
        label: this.$t("conversation.subtitles.version_name"),
        testField: testName,
      },
      maxLength: {
        value: 50,
        error: null,
        valid: false,
        label: this.$t("conversation.subtitles.max_char_length"),
        testField: null,
        type: "range",
        customParams: {
          min: 10,
          max: 100,
        },
      },
      maxDuration: {
        value: "0",
        error: null,
        valid: false,
        label: this.$t("conversation.subtitles.max_duration"),
        testField: null,
        type: "range",
        customParams: {
          min: 0,
          max: 10,
        },
      },
      fields: ["versionName", "maxLength", "maxDuration"],
      selectOptions: {
        action: [
          {
            value: 1,
            text: this.$i18n.t(
              "conversation.subtitles.split_selection.no_split"
            ),
          },
          {
            value: 2,
            text: this.$i18n.t(
              "conversation.subtitles.split_selection.split_over_two_lines"
            ),
          },
          {
            value: 3,
            text: this.$i18n.t(
              "conversation.subtitles.split_selection.split_over_three_lines"
            ),
          },
        ],
      },
      selectedOptionValue: 1,
    }
  },
  computed: {
    maxDurationLabel() {
      return this.maxDuration.value === "0"
        ? "auto"
        : this.maxDuration.value + "s"
    },
    selectedOPtion() {
      return this.selectOptions.action.find(
        (elem) => elem.value === this.selectedOptionValue
      )
    },
  },
  methods: {
    selectionChange(value) {
      this.selectedOptionValue = value
    },
    generateSubtitles() {
      if (this.testFields()) {
        workerSendMessage("generate_subtitles", {
          data: {
            screenCharSize: this.maxLength.value,
            screenMaxDuration:
              this.maxDuration.value === "0"
                ? undefined
                : this.maxDuration.value,
            screenLines: this.selectedOptionValue,
            version: this.versionName.value,
          },
        })
        this.$emit("on-close")
      }
    },
  },
  components: {
    ModalNew,
    FormInput,
    CustomSelect,
  },
}
</script>
