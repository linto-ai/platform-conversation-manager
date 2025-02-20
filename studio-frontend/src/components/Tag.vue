<template>
  <div
    class="tag"
    :clickable="clickable"
    :draggable="editable"
    @dragstart="dragStart"
    @click="onClick">
    <div
      class="tag__category"
      v-if="categoryName"
      :class="[classTextSize, classBackgroundColor, classCategoryColor]">
      {{ categoryName }}
    </div>
    <div
      class="tag__value flex align-center"
      :class="[classTextSize, classBackgroundColor, classTextColor]">
      <!-- <span class="tag__triangle" /> -->
      <span class="flex1 tag__value__main">{{ value }}</span>
      <button
        @click="$emit('remove')"
        v-if="removable"
        class="transparent inline">
        <span
          class="icon remove tag__remove"
          :class="{ small: size == 'small' }"
          :title="$t('tags.remove_tag')" />
      </button>
      <button @click="deleteTag" v-if="deletable" class="transparent inline">
        <span
          class="icon trash"
          :class="{ small: size == 'small' }"
          :title="$t('tags.remove_tag')" />
      </button>
    </div>
  </div>
</template>

<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"

export default {
  props: {
    tagId: { type: String, required: false },
    value: { type: String, required: true },
    categoryId: { type: String, required: false },
    categoryName: { type: String, required: false, default: "" },
    color: { type: String, required: false, default: "brown" },
    size: { type: String, required: false, default: "small" },
    removable: { type: Boolean, required: false, default: false }, // add a cross to remove the tag
    deletable: { type: Boolean, required: false, default: false }, // add a trash to delete the tag
    editable: { type: Boolean, required: false, default: false },
    clickable: { type: Boolean, required: false, default: false },
  },
  data() {
    return {
      classTextSize: this.size == "small" ? "small-text" : "medium-text",
      //classColor,
    }
  },
  computed: {
    classBackgroundColor() {
      return `background-${this.color}-50`
    },
    classTextColor() {
      return `color-${this.color}-900`
    },
    classCategoryColor() {
      return `color-${this.color}-900`
    },
  },
  mounted() {},
  methods: {
    dragStart(e) {
      e.dataTransfer.setData("tagId", this.tagId)
      e.dataTransfer.setData("categoryId", this.categoryId)
    },
    deleteTag(e) {
      this.$emit("delete")
      e.stopPropagation()
    },
    onClick(e) {
      if (this.clickable) this.$emit("click", e)
    },
  },
  components: { Fragment },
}
</script>
