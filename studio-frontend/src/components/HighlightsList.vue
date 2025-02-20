<template>
  <div class="highlights-list flex col gap-medium">
    <h2
      v-if="!loading"
      class="flex align-center highlights-list__title gap-small"
      @click="openHighlightModal">
      <span class="flex1">{{
        $t("app_editor_highlights_modal.ia_title")
      }}</span>
      <span class="icon medium edit"></span>
    </h2>
    <!-- <button class="green" @click="openHighlightModal" v-if="!loading">
      <span class="icon add"></span>
      <span class="label"></span>
    </button> -->
    <AppEditorHighLightModal
      v-if="showHighlightModal"
      :servicesList="services"
      :hightlightsCategories="hightlightsCategories"
      @on-confirm="generateKeywords"
      @on-cancel="closeHighlightModal">
    </AppEditorHighLightModal>
    <TagCategoryBoxHighlight
      v-if="!loading"
      v-for="cat of hightlightsCategories"
      :key="cat._id"
      :category="cat"
      :show="hightlightsCategoriesVisibility[cat._id]"
      @hide-category="(id) => $emit('hide-category', id)"
      @show-category="(id) => $emit('show-category', id)"
      @delete-tag="(tag) => $emit('delete-tag', tag)"
      @clickOnTag="(tag) => $emit('clickOnTag', tag)"
      :job="getJobsFromService(cat.name)"
      :conversationId="conversationId">
      <template v-slot:content-under-tag="slotProps">
        <slot name="content-under-tag" v-bind:tag="slotProps.tag"></slot>
      </template>
    </TagCategoryBoxHighlight>
    <div
      v-if="nonEmptyCategories.length == 0 && !loading && jobsList.length == 0"
      class="center-text">
      {{ $t("app_editor_highlights_modal.no_highlights_first_line") }}
      <br />
      {{ $t("app_editor_highlights_modal.no_highlights_second_line") }}
    </div>
    <div v-if="loading" class="center-text small-padding">
      <!-- <div>Querying Ai services</div> -->
      <div>{{ $t("app_editor_highlights_modal.loading_services") }}</div>
      <span class="icon loading"></span>
    </div>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import { apiGetNlpService } from "../api/service.js"
import TagCategoryBoxHighlight from "./TagCategoryBoxHighlight.vue"
import AppEditorHighLightModal from "./AppEditorHighLightModal.vue"
import { workerSendMessage } from "../tools/worker-message"

export default {
  props: {
    conversationId: {
      type: String,
      required: true,
    },
    conversation: {
      type: Object,
      required: true,
    },
    hightlightsCategories: {
      type: Array,
      required: true,
    },
    hightlightsCategoriesVisibility: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      services: [],
      loading: true,
      showHighlightModal: false,
    }
  },
  async mounted() {
    await this.getServices()
    this.loading = false
  },
  beforeDestroy() {},
  computed: {
    jobs() {
      return this.conversation?.jobs
    },
    jobsList() {
      let res = Object.keys(this.jobs).filter(
        (key) =>
          this.jobs[key].state &&
          this.jobs[key].state != "error" &&
          this.jobs[key].state != "done" &&
          key != "transcription"
      )
      return res
    },
    getJobsFromService() {
      return (name) => this.jobs[name] || null
    },
    nonEmptyCategories() {
      if (!this.hightlightsCategories) return []
      return this.hightlightsCategories.filter((cat) => cat.tags.length > 0)
    },
  },
  methods: {
    async getServices() {
      const req = await apiGetNlpService()
      this.services = req
    },
    openHighlightModal() {
      this.showHighlightModal = true
    },
    closeHighlightModal() {
      this.showHighlightModal = false
    },
    generateKeywords(services) {
      for (let service of services) {
        workerSendMessage("fetch_hightlight", {
          serviceScope: "", //service.scope,
          categoryName: service.categoryName,
          categoryId: service.categoryId,
        })
      }
      this.closeHighlightModal()
    },
  },
  components: { Fragment, TagCategoryBoxHighlight, AppEditorHighLightModal },
}
</script>
