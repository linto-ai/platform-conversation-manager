<template>
  <MainContent sidebar>
    <template v-slot:breadcrumb-actions>
      <div class="flex align-center gap-small">
        <ConversationShareMultiple
          v-if="!noConversations"
          :currentOrganizationScope="currentOrganizationScope"
          :userInfo="userInfo"
          :selectedConversations="selectedConversations" />
      </div>
    </template>

    <ExploreModalVue
      :value="selectedTags"
      :current-organization-scope="currentOrganizationScope"
      :categories="tagCategoriesUnionSelectedtags"
      :loading-categories="loadingCategoriesUnion"
      v-if="showExploreModal"
      :with-search="false"
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
      <ConversationListHeader
        v-if="!noConversations"
        :options="options"
        v-model="selectedOption"
        :with-search="!noConversations"
        :withSelector="!noConversations"
        @searchInConversationsTitle="onSearchInConversationsTitle"
        @searchInConversationsText="onSearchInConversationsText">
        <h2>
          {{ $t("sharedWithTab.title") }}
        </h2>
        <span>
          {{ $t("sharedWithTab.subtitle") }}
        </span>
      </ConversationListHeader>

      <ConversationList
        :conversations="conversations"
        :loading="loading"
        :currentOrganizationScope="currentOrganizationScope"
        :selectable="true"
        :selectedConversations="selectedConversationsList"
        @onSelectConversation="onSelectConversation"
        :pageSharedWith="true"
        :displayTags="true"
        :error="error"
        @clickOnTag="clickOnTag">
        <template v-slot:emptyPlaceholder>
          <div class="flex col align-center justify-center flex1">
            <h2 class="center-text">
              {{ $t("sharedWithTab.no_media_title") }}
            </h2>
            <Svglogo style="max-height: 15rem" />
            <div>
              {{ $t("sharedWithTab.no_media_subtitle") }}
            </div>
          </div>
        </template>
      </ConversationList>

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
import { bus } from "@/main.js"

import ConversationList from "@/components/ConversationList.vue"
import { apiGetConversationsSharedWith } from "@/api/conversation.js"
import { apiGetSharedCategoriesTree } from "@/api/tag.js"
import { extractTagsFromCategoryTree } from "@/tools/extractTagsFromCategoryTree"
import { indexTags } from "@/tools/indexTags"

import { debounceMixin } from "@/mixins/debounce"
import { conversationListMixin } from "@/mixins/conversationList"

import MainContent from "@/components/MainContent.vue"
import ExploreModalVue from "@/components/ExploreModal.vue"
import ConversationListSearch from "@/components/ConversationListSearch.vue"
import Pagination from "@/components/Pagination.vue"
import ConversationShareMultiple from "@/components/ConversationShareMultiple.vue"
import SelectedConversationIndicator from "@/components/SelectedConversationIndicator.vue"
import ConversationListHeader from "@/components/ConversationListHeader.vue"
import SidebarFilters from "@/components/SidebarFilters.vue"
import Svglogo from "@/svg/ShareBalloon.vue"

export default {
  mixins: [debounceMixin, conversationListMixin],
  props: {
    userInfo: { type: Object, required: true },
    currentOrgaPersonal: { type: Boolean, required: true },
    currentOrganizationScope: { type: String, required: true },
  },
  data() {
    return {
      conversations: [],
      tagsDatabase: {},
      loading: true,
      loadingCategoriesUnion: true,
      customFiltersKey: "shareCustomFilters",
      selectedTagsKey: "shareSelectedTags",
      error: null,
      selectedOption: "last_update",
      options: {
        sort: [
          { value: "created", text: this.$i18n.t("inbox.sort.created") },
          {
            value: "last_update",
            text: this.$i18n.t("inbox.sort.last_update"),
          },
        ],
      },
    }
  },
  async mounted() {
    this.tagsDatabase = await this.fetchAllTags()

    this.selectedTags = await this.getSelectedTags()
    this.fetchConversations()
    this.queryCategoriesUnionSelectedtag()
  },
  computed: {},
  watch: {
    selectedOption() {
      this.fetchConversations()
      this.queryCategoriesUnionSelectedtag()
    },
  },
  methods: {
    async fetchConversations() {
      let res
      this.loading = true
      try {
        res = await apiGetConversationsSharedWith(
          this.selectedTags.map((tag) => tag._id),
          this.customFilters?.textConversation?.value,
          this.customFilters?.titleConversation?.value,
          this.currentPageNb,
          { sortField: this.selectedOption },
        )
      } catch (error) {
        this.error = error
      } finally {
        this.loading = false
      }

      this.totalElementsNumber = res?.count || 0
      this.conversations = res?.list || []
    },
    async fetchAllTags() {
      const catTree = await apiGetSharedCategoriesTree()
      const tags = extractTagsFromCategoryTree(catTree)
      const indexedTags = indexTags(tags)
      return indexedTags
    },
    queryCategoriesUnionSelectedtag() {
      this.loadingCategoriesUnion = true
      apiGetSharedCategoriesTree(this.selectedTags.map((tag) => tag._id))
        .then((response) => {
          this.tagCategoriesUnionSelectedtags = response
          this.loadingCategoriesUnion = false
        })
        .catch((error) => {
          this.loadingCategoriesUnion = false
          console.error(error)
        })

      return
    },
  },
  components: {
    ConversationList,
    MainContent,
    ExploreModalVue,
    ConversationListSearch,
    Pagination,
    ConversationShareMultiple,
    SelectedConversationIndicator,
    ConversationListHeader,
    Svglogo,
    SidebarFilters,
  },
}
</script>
