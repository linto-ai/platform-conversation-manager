<template>
  <div class="relative popover-parent">
    <div @click="displayMenu" class="session-endpoint-label">
      {{
        $tc("session.channels_list.multiple_endpoint", endpoints_list.length)
      }}
    </div>
    <ContextMenu
      v-if="menuIsVisible"
      class="fit-content"
      first
      name="enpoints-menu"
      v-click-outside="hideMenu">
      <SessionChannelsEndpointsLine
        v-for="endpoint in endpoints_list"
        :endpoint="endpoint"
        :key="endpoint"></SessionChannelsEndpointsLine>
    </ContextMenu>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import ContextMenu from "./ContextMenu.vue"
import SessionChannelsEndpointsLine from "./SessionChannelsEndpointsLine.vue"

export default {
  props: {
    endpoints: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      menuIsVisible: false,
    }
  },
  mounted() {},
  computed: {
    endpoints_list() {
      return Object.values(this.endpoints)
    },
  },
  methods: {
    displayMenu() {
      this.menuIsVisible = true
    },
    hideMenu() {
      this.menuIsVisible = false
    },
  },
  components: { Fragment, ContextMenu, SessionChannelsEndpointsLine },
}
</script>
