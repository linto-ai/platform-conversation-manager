<template>
  <div class="sidebar__section flex1">
    <h3 class="flex align-center">
      <span class="flex1">Filtres</span>
      <button class="icon-only transparent" @click="resetFilters">
        <span class="icon clear-history"></span>
      </button>
    </h3>
    <div class="flex wrap gap-small"></div>

    <div class="flex wrap gap-small">
      <Tag
        v-for="customfilter of customFilters"
        :key="customfilter._id"
        size="normal"
        :value="customfilter.value"
        :categoryName="customfilter.title"
        :deletable="true"
        @delete="removeCustomFilter(customfilter)" />
      <Tag
        v-for="tag of selectedTags"
        :key="tag._id"
        size="normal"
        :value="tag.name"
        :color="tag.color"
        :categoryId="tag.categoryId"
        :categoryName="tag.categoryName"
        :deletable="true"
        @delete="removeTag(tag)" />

      <button
        class="flex align-center only-border fullwidth"
        @click="addSearchCriterion">
        <span class="icon add"></span>
        <span class="flex1 left-text">Ajouter des tags</span>
      </button>
    </div>
  </div>
</template>
<script>
import { bus } from "@/main.js"
import Tag from "@/components/Tag.vue"

export default {
  props: {
    selectedTags: {
      type: Array,
      required: false,
      default: () => [],
    },
    customFilters: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },
  data() {
    return {}
  },
  mounted() {},
  methods: {
    removeCustomFilter(filter) {
      const newValue = Object.assign({}, this.customFilters)
      delete newValue[filter.key]
      this.$emit("onUpdateCustomFilters", newValue)
    },
    addSearchCriterion() {
      this.$emit("addSearchCriterion")
    },
    removeTag(tag) {
      const newValue = this.selectedTags.filter((t) => t._id != tag._id)
      this.$emit("onUpdateSelectedTags", newValue)
    },
    resetFilters() {
      this.$emit("onUpdateSelectedTags", [])
      this.$emit("onUpdateCustomFilters", {})
    },
  },
  components: {
    Tag,
  },
}
</script>
