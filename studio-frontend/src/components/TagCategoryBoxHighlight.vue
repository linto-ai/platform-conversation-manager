<template>
  <TagCategoryBox
    v-if="!empty"
    :key="reload"
    :category="_category"
    scope="conversation"
    :scopeId="conversationId"
    :selectable="false"
    :fixed="empty || loading"
    :closeBox="closeBox"
    @clickOnTag="(tag) => $emit('clickOnTag', tag)">
    <template v-slot:content-just-before-title="slotProps">
      <span class="icon ai"></span>
    </template>

    <template v-slot:content-after-title="slotProps">
      <!-- <button class="green" @click="generateKeyword" v-if="!loading && empty">
        <span class="icon plus"></span>
      </button> -->
      <span class="icon loading" v-if="loading"></span>
      <span
        class="icon show"
        v-if="!loading && !empty && show"
        @click="hideCategory"></span>
      <span
        class="icon hide"
        v-if="!loading && !empty && !show"
        @click="showCategory"></span>
    </template>

    <template v-slot:content-after-tag="slotProps">
      <button class="icon-only small transparent" @click="deleteTag(slotProps)">
        <span class="icon trash"></span>
      </button>
    </template>
    <template v-slot:content-under-tag="slotProps">
      <slot name="content-under-tag" v-bind:tag="slotProps.tag"></slot>
    </template>
  </TagCategoryBox>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import TagCategoryBox from "./TagCategoryBox.vue"
import { workerSendMessage } from "../tools/worker-message.js"
import ModalDeleteTagHighlight from "./ModalDeleteTagHighlight.vue"
import CATEGORY_NAME_FROM_SCOPE from "../const/categoryNameFromScope.js"

export default {
  props: {
    category: { type: Object, required: true },
    conversationId: { type: String, required: true },
    job: { type: Object, required: false },
    show: { type: Boolean, required: false },
  },
  data() {
    return {
      reload: false,
      closeBox: false,
    }
  },
  watch: {
    job: {
      handler: function (val, oldVal) {
        const status = val.state
        if (status === "done") {
          this.reload = !this.reload
        }
      },
      deep: true,
    },
  },
  computed: {
    empty() {
      return this.category.tags.length === 0 && !this.loading
    },
    loading() {
      const status = this.job?.state
      return (
        status === "running" || status === "pending" || status === "started"
      )
    },
    _category() {
      return {
        ...this.category,
        name: this.getName(this.category.scope),
      }
    },
  },
  mounted() {},
  watch: {
    loading: function (val) {
      if (val) {
        this.closeBox = !this.closeBox
      }
    },
  },
  methods: {
    getName(scope) {
      return (
        CATEGORY_NAME_FROM_SCOPE((key) => this.$i18n.t(key))[scope] ??
        this.category.name
      )
    },
    showCategory(e) {
      this.$emit("show-category", this.category._id)
      e.stopPropagation()
    },
    hideCategory(e) {
      this.$emit("hide-category", this.category._id)
      e.stopPropagation()
    },

    deleteTag({ tag }) {
      this.$emit("delete-tag", tag)
    },
    closeDeleteModal() {
      this.showDeleteModal = false
    },
    showDeleteModalAction(tag) {
      this.tagToDelete = tag
      this.showDeleteModal = true
    },
  },
  components: { Fragment, TagCategoryBox, ModalDeleteTagHighlight },
}
</script>
