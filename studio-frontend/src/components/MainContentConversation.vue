<template>
  <MainContent
    noBreadcrumb
    :organizationPage="organizationPage"
    :sidebar="sidebar"
    :box="box"
    :fullwidthContent="!box"
    v-if="dataLoaded && status == 'done'">
    <template v-slot:breadcrumb-actions>
      <slot name="breadcrumb-actions"></slot>
    </template>

    <template v-slot:sidebar>
      <slot name="sidebar"></slot>
    </template>
    <slot></slot>
    <Modal></Modal>
  </MainContent>
  <div v-else-if="dataLoaded && status != 'done' && status != 'error'">
    <ConversationStatus :conversation="conversation"></ConversationStatus>
  </div>
  <div v-else-if="dataLoaded && status == 'error'">
    <conversationStatusError
      :conversation="conversation"></conversationStatusError>
  </div>
  <div v-else-if="!error" id="conversation-is-loading">
    <Loading :title="dataLoadedStatus"></Loading>
  </div>
  <div v-else>
    <ErrorView></ErrorView>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import MainContent from "./MainContent.vue"
import ConversationStatus from "../components/ConversationStatus.vue"
import ConversationStatusError from "../components/ConversationStatusError.vue"
import Loading from "./Loading.vue"
import ErrorView from "@/views/Error.vue"
import Modal from "@/components/Modal.vue"
export default {
  props: {
    status: {
      type: String,
      default: "loading",
    },
    dataLoaded: {
      type: Boolean,
      required: true,
    },
    dataLoadedStatus: {
      type: String,
      default: null,
    },
    error: {
      type: Boolean,
      required: true,
    },
    conversation: {
      type: Object,
      default: () => {},
    },
    sidebar: {
      type: Boolean,
      default: false,
    },
    organizationPage: {
      type: Boolean,
      default: false,
    },
    box: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {},
  components: {
    Fragment,
    MainContent,
    ConversationStatus,
    ConversationStatusError,
    Loading,
    ErrorView,
    Modal,
  },
}
</script>
