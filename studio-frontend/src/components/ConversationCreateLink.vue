<template>
  <div class="flex col">
    <!-- <h2>{{ $t("conversation_creation.url_tab.main_info_title") }}</h2> -->
    <!-- <FormInput :field="nameFields" v-model="nameFields.value" /> -->
    <FormInput
      :field="linkFields"
      v-model="linkFields.value"
      inputFullWidth
      class="flex1" />
    <button class="audio-upload__link_create-btn" @click="add_link">
      <span class="label"
        >{{ $t("conversation_creation.url_tab.get_button") }}
      </span>
    </button>
    <!-- <FormCheckbox
      disabled
      :field="liveFields"
      v-model="liveFields.value"
      switchDisplay /> -->
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import FormInput from "./FormInput.vue"
import FormCheckbox from "./FormCheckbox.vue"
import EMPTY_FIELD from "@/const/emptyField"
import { testFieldEmpty } from "@/tools/fields/testEmpty.js"
import { formsMixin } from "@/mixins/forms.js"

export default {
  mixins: [formsMixin],
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      linkFields: {
        ...EMPTY_FIELD,
        label: this.$i18n.t("conversation_creation.url_tab.url_label"),
        value: "",
        placeholder: "https://www.youtube.com/watch?v=YBpfClfbf0Y",
        testField: testFieldEmpty,
      },
      fields: ["linkFields"],
    }
  },
  computed: {},
  mounted() {},
  methods: {
    add_link(e) {
      e.preventDefault()
      if (this.testFields()) {
        this.$emit("input", this.linkFields.value)
        this.linkFields.value = ""
      }
    },
  },
  components: { Fragment, FormInput, FormCheckbox },
}
</script>
