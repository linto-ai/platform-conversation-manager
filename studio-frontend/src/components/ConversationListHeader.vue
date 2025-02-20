<template>
  <div class="flex gap-medium align-center">
    <div class="flex col flex1">
      <slot></slot>
    </div>

    <ConversationListSearch
      v-if="withSearch"
      @searchInConversationsTitle="onSearchInConversationsTitle"
      @searchInConversationsText="onSearchInConversationsText" />
    <div class="form-field flex col" v-if="withSelector">
      <label for="options-list">{{ $t("explore.sort_label") }}</label>
      <CustomSelect
        id="options-list"
        :options="options"
        inline
        v-model="selectedOption"
        buttonClass="btn--input-color"></CustomSelect>
    </div>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import ConversationListSearch from "./ConversationListSearch.vue"
import CustomSelect from "./CustomSelect.vue"
export default {
  props: {
    value: { type: String, required: true },
    withSearch: { type: Boolean, default: false },
    options: {
      type: Object,
      required: true,
    },
    withSelector: { type: Boolean, default: true },
  },
  data() {
    return {
      //selectedOption: "fr-FR",
    }
  },
  computed: {
    selectedOption: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("input", value)
      },
    },
  },
  mounted() {},
  methods: {
    onSearchInConversationsTitle(search) {
      this.$emit("searchInConversationsTitle", search)
    },
    onSearchInConversationsText(search) {
      this.$emit("searchInConversationsText", search)
    },
  },
  components: { Fragment, ConversationListSearch, CustomSelect },
}
</script>
