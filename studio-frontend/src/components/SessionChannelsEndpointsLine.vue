<template>
  <div class="context-menu__element flex gap-small" @click="copyEndpoint">
    <pre class="flex1 overflow-horizontal-auto">{{ endpoint }}</pre>
    <button class="icon-only">
      <span class="icon copy" v-if="!endpointHasbeenCopied"></span>
      <span class="icon apply" v-else></span>
    </button>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
export default {
  props: {
    endpoint: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      endpointHasbeenCopied: false,
    }
  },
  mounted() {},
  methods: {
    copyEndpoint() {
      const endpoint = this.endpoint
      navigator.clipboard.writeText(endpoint)
      this.endpointHasbeenCopied = true
      setTimeout(() => {
        this.endpointHasbeenCopied = false
      }, 2000)
    },
  },
  components: { Fragment },
}
</script>
