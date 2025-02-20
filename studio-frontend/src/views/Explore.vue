<template>
  <MainContent sidebar>
    <!-- TODO: put in a component?-->
    <template v-slot:breadcrumb-actions>
      <div class="flex align-center gap-small">
        <button class="red-border btn" @click="clickDeleteConvButton">
          <span class="icon trash"></span>
          <span class="label">{{
            $tc("conversation.delete_mutltiple", selectedConversationsSize)
          }}</span>
        </button>
        <ConversationShareMultiple
          :currentOrganizationScope="currentOrganizationScope"
          :userInfo="userInfo"
          :selectedConversations="selectedConversations" />
      </div>
    </template>

    <ModalDeleteConversations
      v-if="displayDeleteModal"
      :conversationsCount="selectedConversationsSize"
      :conversationsInError="conversationsInError"
      @on-cancel="closeDeleteModal"
      @on-confirm="deleteConversations" />

    <ExploreModalVue
      :value="selectedTags"
      :current-organization-scope="currentOrganizationScope"
      :categories="tagCategoriesUnionSelectedtags"
      :loading-categories="loadingCategoriesUnion"
      v-if="showExploreModal"
      @apply="applyFilters"
      @cancel="closeExploreModal" />

    <template v-slot:sidebar>
      <div class="sidebar-divider"></div>
      <SidebarFilters
        :custom-filters="customFilters"
        :selected-tags="selectedTags"
        @onUpdateSelectedTags="onUpdateSelectedTags"
        @onUpdateCustomFilters="onUpdateCustomFilters"
        @addSearchCriterion="openExploreModal" />
    </template>

    <section class="flex col flex1 gap-small reset-overflows">
      <!-- title -->
      <ConversationListHeader
        :options="options"
        v-model="selectedOption"
        with-search
        @searchInConversationsTitle="onSearchInConversationsTitle"
        @searchInConversationsText="onSearchInConversationsText">
        <h2>
          {{ $t("explore.title") }}
        </h2>
        <!-- <span>
          {{ $t("explore.subtitle") }}
        </span> -->
      </ConversationListHeader>

      <!-- search -->

      <!-- List -->
      <ConversationList
        :loading="loadingConversations"
        :conversations="conversations"
        :currentOrganizationScope="currentOrganizationScope"
        :error="error"
        :selectable="true"
        :selectedConversations="selectedConversationsList"
        @onSelectConversation="onSelectConversation"
        @clickOnTag="clickOnTag" />

      <!-- pagination -->
      <div class="bottom-list-sticky">
        <Pagination
          v-model="currentPageNb"
          :pages="totalPagesNumber"
          class="pagination--sticky"
          v-if="totalPagesNumber > 1 && !error" />

        <SelectedConversationIndicator
          v-if="selectedConversationsSize > 0"
          :selectedConversationsSize="selectedConversationsSize" />
      </div>
    </section>
  </MainContent>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "@/main.js"
import { apiSearchTagsById, apiCategoriesTree } from "@/api/tag.js"
import {
  apiGetConversationsByTags,
  apiGetConversationsByOrganization,
  apiGetConversationsWithoutTagsByOrganization,
} from "@/api/conversation.js"
import { debounceMixin } from "@/mixins/debounce"
import { conversationListOrgaMixin } from "@/mixins/conversationListOrga.js"

import ConversationList from "@/components/ConversationList.vue"
import Tag from "@/components/Tag.vue"
import MainContent from "@/components/MainContent.vue"
import ExploreModalVue from "@/components/ExploreModal.vue"
import { extractTagsFromCategoryTree } from "@/tools/extractTagsFromCategoryTree"
import ConversationListSearch from "@/components/ConversationListSearch.vue"
import Pagination from "@/components/Pagination.vue"
import ModalDeleteConversations from "@/components/ModalDeleteConversations.vue"
import ConversationShareMultiple from "@/components/ConversationShareMultiple.vue"
import SelectedConversationIndicator from "@/components/SelectedConversationIndicator.vue"
import ConversationListHeader from "@/components/ConversationListHeader.vue"
import SidebarFilters from "@/components/SidebarFilters.vue"

export default {
  mixins: [debounceMixin, conversationListOrgaMixin],
  props: {
    userInfo: { type: Object, required: true },
    currentOrganizationScope: { type: String, required: true },
    currentOrgaPersonal: { type: Boolean, required: true },
  },
  data() {
    return {
      loadingConversations: true,
      conversations: [],
      customFiltersKey: "exploreCustomFilters",
      selectedTagsKey: "exploreSelectedTags",
      showExploreModal: false,
      loadingCategoriesUnion: true,
      error: null,
      selectedOption: "last_update",
      options: {
        sort: [
          {
            value: "last_update",
            text: this.$i18n.t("inbox.sort.last_update"),
          },
          { value: "created", text: this.$i18n.t("inbox.sort.created") },
          { value: "notags", text: this.$i18n.t("inbox.sort.notags") },
        ],
      },
    }
  },
  async mounted() {
    this.selectedTags = await this.getSelectedTags()
    // this.showExploreModal =
    //   this.selectedTags.length == 0 &&
    //   Object.keys(this.customFilters).length == 0
    this.fetchConversations()
    this.queryCategoriesUnionSelectedtag()
  },
  methods: {
    async apiSearchConversations() {
      let res
      //this.totalElementsNumber = 0
      this.loadingConversations = true

      if (this.selectedOption == "notags") {
        res = await apiGetConversationsWithoutTagsByOrganization(
          this.currentOrganizationScope,
          this.currentPageNb,
        )
      } else if (
        (!this.selectedTags || this.selectedTags.length == 0) &&
        !this.customFilters?.textConversation?.value &&
        !this.customFilters?.titleConversation?.value
      ) {
        res = await apiGetConversationsByOrganization(
          this.currentOrganizationScope,
          this.currentPageNb,
          {
            sortField: this.selectedOption,
          },
        )
      } else {
        res = await apiGetConversationsByTags(
          this.currentOrganizationScope,
          this.selectedTags.map((tag) => tag._id),
          this.customFilters?.textConversation?.value,
          this.customFilters?.titleConversation?.value,
          this.currentPageNb,
          {
            sortField: this.selectedOption,
          },
        )
      }
      this.loadingConversations = false
      this.totalElementsNumber = res?.count || 0
      return res?.list || []
    },
    async fetchConversations() {
      try {
        this.conversations = await this.debouncedSearch(
          this.apiSearchConversations.bind(this),
          this.searchTextInConversations,
        )
      } catch (error) {
        this.conversations = []
        this.loadingConversations = false
        console.error("request error", error)
        this.error = error
      }

      if (this.conversations.length == 0 && this.currentPageNb > 0) {
        this.currentPageNb = 0
      }
    },
    async getSelectedTags() {
      const tagsFromStorage = JSON.parse(
        localStorage.getItem("exploreSelectedTags"),
      )
      if (
        localStorage.getItem("exploreSelectedTags") &&
        tagsFromStorage.length > 0
      ) {
        // check if tag exists by querying the API
        const tagTreeFromApi = await apiSearchTagsById(
          this.currentOrganizationScope,
          tagsFromStorage.map((t) => t._id),
        )
        const tags = extractTagsFromCategoryTree(tagTreeFromApi)
        return tags
      }
      return []
    },
    async queryCategoriesUnionSelectedtag() {
      this.loadingCategoriesUnion = true

      const metadata_cat = await apiCategoriesTree(
        this.currentOrganizationScope,
        this.selectedTags.map((tag) => tag._id),
        this.selectedTags.map((tag) => tag.categoryId),
        "conversation_metadata",
      )

      // const highlight_cat = await apiCategoriesTree(
      //   this.currentOrganizationScope,
      //   this.selectedTags.map((tag) => tag._id),
      //   this.selectedTags.map((tag) => tag.categoryId),
      //   "highlight"
      // )

      this.tagCategoriesUnionSelectedtags = metadata_cat
      this.loadingCategoriesUnion = false
    },
    async verifyTags(tags) {
      const tagTreeFromApi = await apiSearchTagsById(
        this.currentOrganizationScope,
        tagsFromStorage.map((t) => t._id),
        "organization",
      )
      return extractTagsFromCategoryTree(tagTreeFromApi)
    },
  },
  watch: {
    currentOrganizationScope() {
      //this.fetchConversations()
      this.queryCategoriesUnionSelectedtag()
    },
    selectedOption() {
      this.fetchConversations()
    },
  },
  components: {
    MainContent,
    Fragment,
    ConversationList,
    Tag,
    ExploreModalVue,
    ConversationListSearch,
    Pagination,
    ModalDeleteConversations,
    ConversationShareMultiple,
    SelectedConversationIndicator,
    ConversationListHeader,
    SidebarFilters,
  },
}
</script>
