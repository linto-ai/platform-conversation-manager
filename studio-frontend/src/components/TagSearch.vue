<template>
  <div>
    <div
      v-if="loading"
      class="flex1 relative dropDown-section"
      style="min-height: 50px">
      <Loading />
    </div>

    <div v-else-if="search != ''">
      <div class="dropDown-section">
        <div class="form-label">{{ $t("tags.tags") }}</div>
        <TagCategoryBoxSelectable
          v-for="category of mergedTags"
          :key="category._id"
          :category="category"
          :value="value"
          :scopeId="scopeId"
          scope="scope"
          :startOpen="true"
          :showCategoryName="false"
          :addable="addable"
          :selectable="selectable"
          @selectTag="selectTag"
          @unSelectTag="unSelectTag" />
        <div v-if="mergedTags.length === 0">
          {{ $t("tags.no_tags_found") }}
        </div>
      </div>
    </div>

    <slot v-if="!loading"></slot>
  </div>
</template>
<script>
import uuidv4 from "uuid/v4.js"

import { Fragment } from "vue-fragment"
import { bus } from "@/main.js"
import {
  apiSearchCategories,
  apiSearchTags,
  apiGetAllCategories,
} from "@/api/tag.js"
import { debounceMixin } from "@/mixins/debounce"
import { mergeArrayOnId } from "@/tools/mergeArrayOnId"
import filterTagsOnCategoryList from "@/tools/filterTagsOnCategoryList"

import Loading from "./Loading.vue"
import SwitchInput from "./SwitchInput.vue"
import Tag from "./Tag.vue"
import TagCategoryBoxSelectable from "./TagCategoryBoxSelectable.vue"
export default {
  props: {
    search: { type: String, default: "" },
    currentOrganizationScope: { type: String, required: false },
    conversationId: { type: String, required: false },
    value: { type: Array, required: true },
    reload: { type: Boolean, default: false },
    addable: { type: Boolean, default: false },
    selectable: { type: Boolean, default: true },

    withCategories: { type: Boolean, default: true },
    searchCategoryType: { type: String, default: "conversation_metadata" },
    possess: { type: Boolean, default: false },
    categoriesList: { type: Array, required: false, default: null }, // if define, search will be done on this list instead of fetching from server
  },
  mixins: [debounceMixin],
  data() {
    return {
      searchedTags: [],
      searchedCategories: [],
      allCategories: [],
      loading: false,
      searchId: uuidv4(),
      mergedTags: [],
      scope: this.currentOrganizationScope ? "organization" : "conversation",
      scopeId: this.currentOrganizationScope || this.conversationId,
    }
  },
  mounted() {
    if (this.search !== "") {
      this.fetchSearchResult(this.search)
    }
  },
  watch: {
    search: function (newSearch, oldSearch) {
      this.fetchSearchResult(newSearch)
    },
    reload() {
      this.fetchSearchResult(this.search)
    },
  },
  methods: {
    apiSearchTags(search, signal) {
      if (this.categoriesList !== null) {
        return Promise.resolve(
          filterTagsOnCategoryList(this.categoriesList, search),
        )
      }

      if (this.conversationId) {
        return apiSearchTags(
          this.conversationId,
          search,
          this.searchCategoryType,
          { scope: "conversation", possess: this.possess },
          signal,
        )
      } else {
        return apiSearchTags(
          this.currentOrganizationScope,
          search,
          this.searchCategoryType,
          { scope: "organization" },
          signal,
        )
      }
    },
    apiSearchCategories(search, signal) {
      if (this.categoriesList !== null) {
        return Promise.resolve(
          filterTagsOnCategoryList(this.categoriesList, search),
        )
      }

      if (this.conversationId) {
        return apiSearchCategories(
          this.conversationId,
          search,
          "conversation_metadata",
          { scope: "conversation", possess: this.possess },
          signal,
        )
      }

      return apiSearchCategories(
        this.currentOrganizationScope,
        search,
        "conversation_metadata",
        { scope: "organization" },
        signal,
      )
    },
    async fetchSearchResult(newSearch) {
      if (newSearch === "") {
        this.searchedTags = []
      } else {
        this.searchedTags = await this.debouncedSearch(
          this.apiSearchTags.bind(this),
          newSearch,
        )

        if (this.withCategories) {
          this.searchedCategories = await this.debouncedSearch(
            this.apiSearchCategories.bind(this),
            newSearch,
          )
        } else {
          this.searchedCategories = []
        }
      }

      this.mergedTags = mergeArrayOnId(
        this.searchedTags,
        this.searchedCategories,
      )
        // don't display tags that are already selected
        .map((catTags) => {
          if (!catTags.tags) {
            return catTags
          }
          catTags.tags = catTags.tags.filter((tag) => {
            return !this.value.find((valueTag) => valueTag._id === tag._id)
          })
          return catTags
        })
        // don't display categories that have no tags left
        .filter((catTags) => catTags.tags && catTags.tags.length > 0)
    },
    async fetchAllCategories() {
      this.loading = true
      this.allCategories = await apiGetAllCategories(
        this.conversationId,
        "conversation_metadata",
        "conversation",
      )
      this.loading = false
    },
    selectTag(tag, category) {
      this.$emit("selectTag", tag, category)
    },
    unSelectTag(tag) {
      this.$emit("unSelectTag", tag)
    },
  },

  components: { Fragment, Loading, SwitchInput, Tag, TagCategoryBoxSelectable },
}
</script>
