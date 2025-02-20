<template>
  <div
    v-if="numberFound"
    class="flex gap-small align-center search-result-paginator">
    <span class="flex1 label"
      >{{ selectedIndexResult + 1 }} /
      {{
        $tc("conversation.search_in_transcription.n_found", numberFound)
      }}</span
    >
    <button class="icon-only small" @click="previousResult">
      <span class="icon previous"></span>
    </button>
    <button class="icon-only small" @click="nextResult">
      <span class="icon next"></span>
    </button>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
export default {
  props: {
    numberFound: Number,
    selectedIndexResult: Number,
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    previousResult() {
      this.$emit("previousResult")
    },
    nextResult() {
      this.$emit("nextResult")
    },
  },
  components: { Fragment },
}
</script>
