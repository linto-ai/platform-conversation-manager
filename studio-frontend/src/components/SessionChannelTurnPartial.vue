<template>
  <SessionChannelTurn
    :turn="turn"
    :selectedTranslations="selectedTranslations" />
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import SessionChannelTurn from "@/components/SessionChannelTurn.vue"

export default {
  props: {
    partialText: {
      type: String,
      required: true,
    },
    partialObject: {
      type: Object,
      required: true,
    },
    selectedTranslations: {
      type: String,
      required: false,
      default: "original",
    },
  },
  data() {
    return {}
  },
  mounted() {},
  computed: {
    turn() {
      return this.partialObject
    },
  },
  methods: {},
  components: { Fragment, SessionChannelTurn },
}
</script>
