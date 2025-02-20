<template>
  <div
    v-if="showCategoryName || tagsList.length > 0"
    :id="`${id}-${category._id}`"
    class="category-box small-padding"
    @dragover="dragOver"
    @dragleave="dragLeave"
    @dragenter="dragOver"
    @drop="drop"
    :class="{ 'no-title': !showCategoryName }">
    <header class="category-box__header">
      <h4
        class="flex row gap-small align-center"
        @click="toggleOpen"
        :class="{ 'no-padding': !open }">
        <span
          class="flex1 flex align-center gap-small"
          :class="[colorTextCategory]">
          <slot name="content-just-before-title"></slot>
          <span>
            {{ displayedCategory.name }}
            <!-- <span v-if="displayedCategory.type == 'highlight'">
              {{ "(Highlight)" }}</span
            > -->
          </span>
          <slot name="content-just-after-title"></slot>
        </span>
        <slot name="content-after-title"></slot>
        <span class="icon" :class="iconClass" v-if="!fixed"></span>
      </h4>
    </header>
    <ul class="category-box__tag-list flex col" v-if="open">
      <li class="flex col" v-for="tag of tagsList" :key="tag._id">
        <div class="flex align-center gap-small">
          <label
            :for="`${id}-${tag._id}`"
            class="flex flex1 no-margin"
            @click="$emit('clickOnTag', tag)">
            <Tag
              :title="$t('tags.select_tag_title')"
              :tagId="tag._id"
              :value="tag.name"
              :categoryId="tag.categoryId"
              :categoryName="showCategoryName ? null : displayedCategory.name"
              :editable="editable"
              :color="category.color" />
          </label>

          <slot name="content-after-tag" v-bind:tag="tag"></slot>
        </div>
        <slot name="content-under-tag" v-bind:tag="tag"></slot>
      </li>
      <div v-if="tagsList.length === 0 && showCategoryName">
        <span class="category-box__no-tag">{{
          $t("tags.no_tags_in_category")
        }}</span>
      </div>

      <slot name="content-after-tag-list"></slot>
    </ul>
  </div>
</template>
<script>
import uuidv4 from "uuid/v4.js"

import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

import {
  apiGetCategoryById,
  apiGetTagsFromCategory,
  apiUpdateTag,
  apiCreateTag,
} from "../api/tag"
import EMPTY_FIELD from "../const/emptyField"

import Tag from "./Tag.vue"

export default {
  props: {
    value: { type: Array, required: false, default: () => [] },
    category: { type: Object, required: true },
    scope: { type: String, required: true }, // "organization" or "conversation"
    scopeId: { type: String, required: true },
    startOpen: { type: Boolean, default: false },
    showCategoryName: { type: Boolean, default: true },
    linkedTags: { type: Array, default: () => [] },
    hiddenSelectedTags: { type: Boolean, default: false },
    editable: { type: Boolean, default: false },
    id: { type: String, default: () => uuidv4() },
    fixed: { type: Boolean, default: false },
    withMetadata: { type: Boolean, default: false },
    possess: { type: Boolean, default: false },
    closeBox: { type: Boolean }, // change its value to close the box from the parent (if true pass it to false and vice versa)
  },
  data() {
    return {
      closeBoxStartValue: this.closeBox,
      loading: false,
      displayedCategory: this.category,
      open: this.startOpen,
      newTagName: {
        ...EMPTY_FIELD,
        label: this.$t("tags.new_tag_name"),
      },
      addingTag: false,
    }
  },
  mounted() {
    bus.$on("tag-category-changed", this.updateCategory)
  },
  beforeDestroy() {
    bus.$off("tag-category-changed", this.updateCategory)
  },
  computed: {
    iconClass() {
      if (this.loading) return "loading"
      return !this.open ? "bottom-arrow" : "top-arrow"
    },
    tagsList() {
      const tags =
        this.displayedCategory?.tags ?? this.displayedCategory?.tag ?? []

      if (!this.hiddenSelectedTags) {
        return tags
      } else {
        return tags.filter((tag) => !this.value.find((t) => t._id === tag._id))
      }
    },
    colorTextCategory() {
      return `color-${this.category.color}-900`
    },
  },
  watch: {
    closeBox() {
      if (this.closeBox !== this.closeBoxStartValue) {
        this.open = false
        this.closeBoxStartValue = this.closeBox
      }
    },
    startOpen() {
      this.open = this.startOpen
    },
    "category.name"() {
      this.displayedCategory.name = this.category.name
    },
    "category.color"() {
      this.displayedCategory.color = this.category.color
    },
    "category.tags"() {
      this.displayedCategory.tags = this.category.tags
    },
  },
  methods: {
    dragOver(e) {
      e.preventDefault()
      e.stopPropagation()
      document
        .getElementById(`${this.id}-${this.category._id}`)
        .classList.add("drag-over")
    },
    async drop(e) {
      if (this.scope === "conversation") return
      document
        .getElementById(`${this.id}-${this.category._id}`)
        .classList.remove("drag-over")

      const tagId = e.dataTransfer.getData("tagId")
      const categoryIdSource = e.dataTransfer.getData("categoryId")

      if (categoryIdSource === this.category._id) return

      await apiUpdateTag(this.scopeId, tagId, {
        categoryId: this.category._id,
      })
      bus.$emit("tag-category-changed", {
        categoryIdTarget: this.category._id,
      })
      bus.$emit("tag-category-changed", {
        categoryIdTarget: categoryIdSource,
      })
    },
    dragLeave(e) {
      e.stopPropagation()
      document
        .getElementById(`${this.id}-${this.category._id}`)
        .classList.remove("drag-over")
    },
    async toggleOpen() {
      if (this.fixed) return
      if (this.loading) return
      this.loading = true
      if (!this.open && this.tagsList.length === 0) {
        await this.fetchTags()
      }
      this.loading = false
      this.open = !this.open
    },
    async fetchTags() {
      if (this.linkedTags.length > 0) {
        const tags = await apiGetTagsFromCategory(
          this.scopeId,
          this.category._id,
          {
            linkedTags: this.linkedTags.map((t) => t._id),
            possess: this.possess,
          },
          this.scope
        )
        this.displayedCategory = {
          ...this.category,
          tags,
        }
      } else {
        this.displayedCategory = await apiGetCategoryById(
          this.scopeId,
          this.category._id,
          this.scope,
          { metadata: this.withMetadata, possess: this.possess }
        )
      }
    },
    updateCategory({ categoryIdTarget }) {
      if (this.category._id === categoryIdTarget) {
        this.fetchTags()
      }
    },
  },
  components: { Fragment, Tag },
}
</script>
