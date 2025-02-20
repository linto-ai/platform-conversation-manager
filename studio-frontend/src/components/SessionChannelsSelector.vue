<template>
  <div class="flex col">
    <label for="channel-selector">{{
      $t("session.live_page.channel_selector.label")
    }}</label>
    <CustomSelect
      class="channel-selector fullwidth"
      v-model="selectedChannel"
      id="channel-selector"
      :aria-label="$t('session.live_page.channel_selector.label')"
      :valueKey="(c) => c.transcriberProfileId"
      :options="channelsList" />
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import CustomSelect from "./CustomSelect.vue"

import { bus } from "../main.js"
export default {
  props: {
    channels: {
      type: Array,
      required: true,
    },
    value: {
      type: Object,
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
    channelsList() {
      let channelsList = this.channels.map((channel) => {
        return {
          value: channel,
          text: `${channel.name}`,
        }
      })

      return {
        channels: channelsList,
      }
    },
    selectedChannel: {
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
