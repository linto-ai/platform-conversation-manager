<template>
  <div class="flex col">
    <label for="channel-selector">{{
      $t("app_editor_translations_selector.label")
    }}</label>
    <CustomSelect
      class="channel-selector fullwidth"
      v-model="selectedTranslation"
      id="channel-selector"
      :aria-label="$t('app_editor_translations_selector.label')"
      :options="translationsList" />
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import CustomSelect from "./CustomSelect.vue"

import { bus } from "../main.js"
export default {
  props: {
    translations: {
      type: Array,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  data() {
    return {}
  },
  computed: {
    name() {
      return "name"
    },
    translationsList() {
      let languageNames = new Intl.DisplayNames([this.$i18n.locale], {
        type: "language",
      })
      let translationsList = this.translations.map((translation) => {
        return {
          value: translation._id,
          text: languageNames.of(translation.locale),
        }
      })

      return {
        original: [
          {
            value: "original",
            text: this.$i18n.t(
              "app_editor_translations_selector.original_language",
            ),
          },
        ],
        translations: translationsList,
      }
    },
    selectedTranslation: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  mounted() {},
  methods: {},
  components: { Fragment, CustomSelect },
}
</script>
