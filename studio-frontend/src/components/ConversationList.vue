<template>
  <div v-if="!loading && !error" class="flex col flex1">
    <div class="flex conversation-list-header align-bottom">
      <slot name="list-header"></slot>
      <!-- <input type="checkbox" title="select all" /> -->
      <!-- <span class="conversation-list-header__number" v-if="selectable">{{
        $tc(
          "conversation.number_of_conversations_selected",
          selectedConversationsSize
        )
      }}</span> -->
    </div>
    <ul
      class="conversation-list flex col gap-medium flex1 reset-overflows"
      v-if="conversations && conversations.length > 0">
      <ConversationLine
        v-for="conv of conversations"
        :key="conv._id + conv.last_update + conv.tags.length"
        :currentOrganizationScope="currentOrganizationScope"
        :conversation="conv"
        :pageSharedWith="pageSharedWith"
        :displayTags="displayTags"
        :tagsReadOnly="tagsReadOnly"
        :indexedTags="indexedTags"
        :selectable="selectable"
        @clickOnTag="clickOnTag"
        @onSelect="onSelect"
        :selectedConversations="selectedConversations" />
    </ul>
    <slot name="emptyPlaceholder" v-else-if="hasPlaceholderWhenEmpty"></slot>
    <div class="flex col align-center justify-center flex1" v-else>
      <h2 class="center-text">
        {{ $t("conversation.no_conversation_found") }}
      </h2>
      <router-link
        v-if="isAtLeastUploader"
        :title="$t('navigation.conversation.create')"
        to="/interface/conversations/create"
        class="btn green-border">
        <span class="label">{{ $t("navigation.conversation.create") }}</span>
        <span class="icon new"></span>
      </router-link>
    </div>
  </div>
  <ErrorPage v-else-if="error" :error="error" />
  <div v-else class="flex col flex1 align-center justify-center relative">
    <loading :title="$t('conversation.loading_list_title')"></loading>
  </div>
</template>

<script>
import { Fragment } from "vue-fragment"

import Loading from "@/components/Loading.vue"
import ConversationLineNew from "@/components/ConversationLineNew.vue"
import ErrorPage from "./ErrorPage.vue"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"

export default {
  mixins: [orgaRoleMixin],
  props: {
    conversations: { type: Array, required: false },
    loading: { type: Boolean, required: true },
    currentOrganizationScope: { type: String, required: true },
    displayTags: { type: Boolean, default: true },
    pageSharedWith: { type: Boolean, default: false },
    indexedTags: { type: Object, required: false }, // tags indexed by id, if not provided will be fetched
    tagsReadOnly: { type: Boolean, default: false },
    error: { type: Object, default: null },
    selectedConversations: { type: Array, default: () => [] },
    selectable: { type: Boolean, default: false },
  },
  data() {
    return {}
  },
  mounted() {},
  computed: {
    hasPlaceholderWhenEmpty() {
      return !!this.$slots?.emptyPlaceholder
    },
  },
  methods: {
    dateToJMYHMS(date) {
      return this.$options.filters.dateToJMYHMS(date)
    },
    onSelect(e) {
      this.$emit("onSelectConversation", e)
    },
    clickOnTag(tag) {
      this.$emit("clickOnTag", tag)
    },
  },
  components: {
    Loading,
    ConversationLine: ConversationLineNew,
    ErrorPage,
  },
}
</script>
