<template>
  <li class="conversation-line-container">
    <div class="flex col">
      <span
        class="icon star conversation-line__favorite no-propagation"
        v-if="!isFavorite"
        :title="$t('conversation.add_to_favorites')"
        @click="toggleFavorite"></span>
      <span
        class="icon star-filled conversation-line__favorite no-propagation"
        v-if="isFavorite"
        :title="$t('conversation.remove_from_favorites')"
        @click="toggleFavorite"></span>
      <input
        type="checkbox"
        class="conversation-line__checkbox"
        :value="conversation._id"
        v-if="selectable"
        v-model="_selectedConversation" />
    </div>

    <div
      class="conversation-line relative flex flex1 gap-medium"
      ref="line"
      @click="selectLine">
      <div class="flex col flex1 justify-evenly small-margin">
        <div class="conversation-line__head col flex">
          <!-- 1st line: owner + title + metadata -->
          <div class="flex align-center">
            <!-- owner -->
            <div
              class="list-profil-picture-container conversation-line__owner"
              :data-info="convOwner.fullName">
              <img :src="convOwner.img" class="list-profil-picture" />
            </div>
            <!-- type -->
            <div
              v-if="isFromSession"
              class="flex"
              :data-info="$t('conversation.source.from_session')">
              <span class="icon record secondary"></span>
            </div>
            <div
              v-else
              class="flex"
              :data-info="$t('conversation.source.from_upload')">
              <span class="icon file-audio secondary" />
            </div>
            <!-- title -->
            <router-link
              :title="conversation.name"
              :to="`/interface/conversations/${conversation._id}/transcription`"
              class="conversation-line__title no-padding no-propagation text-cut">
              {{ conversation.name }}
            </router-link>

            <div class="flex1"></div>
            <!-- metadata-->
            <div class="flex gap-medium conversation-line__metadata">
              <div
                v-if="audioDuration"
                class="conversation-line__duration"
                :title="
                  $t('conversation.duration', { duration: audioDuration })
                ">
                <LabeledValueSmall
                  :label="$t('conversation.duration_label')"
                  :value="audioDuration" />
              </div>
              <div
                class="conversation-line__last-update"
                :title="$t('conversation.updated', { date: lastUpdate })">
                <LabeledValueSmall
                  :label="$t('conversation.update_label')"
                  :value="lastUpdate" />
              </div>
              <div
                class="conversation-line__last-update"
                :title="$t('conversation.created', { date: created })">
                <LabeledValueSmall
                  :label="$t('conversation.created_label')"
                  :value="created" />
              </div>
            </div>
          </div>

          <!-- 2nd line: description -->
          <div
            class="conversation-line__description flex"
            @click="startDescriptionEdition"
            v-if="!descriptionIsEditing">
            <span class="no-propagation">{{ description }}</span>
            <button v-if="canEditConv" class="transparent no-propagation">
              <span class="icon edit no-propagation" />
            </button>
          </div>
          <FormInput
            v-else
            :field="descriptionFormData"
            v-model="descriptionFormData.value"
            withConfirmation
            inputFullWidth
            focus
            @on-cancel="resetDescriptionEdition"
            @on-confirm="saveNewDescription"></FormInput>
        </div>
        <!-- tags -->

        <div
          class="conversation-line__tags flex row gap-small align-bottom"
          v-if="displayTags">
          <span
            class="conversation-line__tag"
            v-for="tag in tags"
            :key="tag._id">
            <Tag
              :value="tag.name"
              :categoryId="tag.categoryId"
              :categoryName="tag.categoryName"
              :color="tag.color"
              :deletable="canEditTag"
              @delete="unSelectTag(tag)"
              clickable
              @click="clickOnTag($event, tag)" />
          </span>
          <!-- <span v-if="tags.length === 0" @click="showDropDown">{{
            $t("tags.no_tags")
          }}</span> -->

          <button
            :title="$t('conversation.add_tag')"
            v-if="canEditTag && !tagsReadOnly"
            @click="showDropDown"
            class="only-border conversation-line__add-tag-btn no-propagation">
            <span class="icon add no-propagation" />
            <span class="label no-propagation">{{ $t("tags.add_tags") }}</span>
          </button>
          <div class="conversation-line__dropDown-container">
            <ContextMenu
              v-if="dropDownVisible"
              :y="dropDownY"
              :x="dropDownX"
              name="main-tag-menu">
              <DropDownAddTag
                v-click-outside="closeDropDown"
                :conversationId="conversation._id"
                :value="tags"
                @close="closeDropDown"
                @selectTag="selectTag"
                @unSelectTag="unSelectTag"></DropDownAddTag>
            </ContextMenu>
          </div>
        </div>
      </div>
      <!-- secondary actions -->
      <div
        class="flex col gap-small justify-center conversation-line__secondary-action-container no-propagation">
        <!-- TODO: put in blue like link-->
        <router-link
          :to="{
            name: 'conversations overview',
            params: { conversationId: this.conversation._id },
          }"
          class="conversation-line__secondary-action">
          <div class="conversation-line__secondary-action__button">
            <span class="label">{{ $t("conversation.open_overview") }}</span>
            <span class="icon information"></span>
          </div>
        </router-link>

        <component
          :is="isFromSession ? 'span' : 'router-link'"
          :disabled="isFromSession"
          :to="{
            name: 'conversations subtitles',
            params: { conversationId: this.conversation._id },
          }"
          class="conversation-line__secondary-action">
          <div class="conversation-line__secondary-action__button">
            <span class="label">{{ $t("conversation.open_subtitles") }}</span>
            <span class="icon subtitle"></span>
          </div>
        </component>

        <router-link
          :to="{
            name: 'conversations publish',
            params: { conversationId: this.conversation._id },
          }"
          class="conversation-line__secondary-action">
          <div class="conversation-line__secondary-action__button">
            <span class="label">{{ $t("conversation.open_publish") }}</span>
            <span class="icon document"></span>
          </div>
        </router-link>
      </div>
    </div>
  </li>
</template>

<script>
import {
  apiAddTagToConversation,
  apiDeleteTagFromConversation,
  apiUpdateConversation,
} from "@/api/conversation"
import { apiSearchTagsById } from "@/api/tag.js"

import { extractTagsFromCategoryTree } from "@/tools/extractTagsFromCategoryTree.js"
import { getUserRightFromConversation } from "@/tools/getUserRightFromConversation.js"

import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { convRoleMixin } from "@/mixins/convRole.js"

import Tag from "@/components/Tag.vue"
import DropDownAddTag from "@/components/DropDownAddTag.vue"
import CustomSelect from "@/components/CustomSelect.vue"
import LabeledValueSmall from "@/components/LabeledValueSmall.vue"
import FormInput from "@/components/FormInput.vue"
import ContextMenu from "./ContextMenu.vue"
import { userName } from "../tools/userName"

export default {
  mixins: [orgaRoleMixin, convRoleMixin],
  props: {
    conversation: { type: Object, required: true },
    currentOrganizationScope: { type: String, required: true },
    displayTags: { type: Boolean, default: true },
    pageSharedWith: { type: Boolean, default: false },
    indexedTags: { type: Object, required: false }, // tags indexed by id, if not provided will be fetched
    tagsReadOnly: { type: Boolean, default: false },
    selectable: { type: Boolean, default: false },
    //selected: { type: Boolean, default: false },
    selectedConversations: { type: Array, default: () => [] },
  },
  data() {
    return {
      dropDownVisible: false,
      tags: [],
      highlightedTags: [],
      originalTags: [],
      loadingTags: false,
      dropDownX: 0,
      dropDownY: 0,
      descriptionIsEditing: false,
      descriptionFormData: {
        value: this.conversation.description || "",
        error: null,
      },
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.displayTags) this.loadTags()
    })
  },
  computed: {
    userInfo() {
      return this.$store.state.userInfo
    },
    rolesInOrganizations() {
      return this.$store.state.rolesInOrganizations
    },
    userRightInConv() {
      return getUserRightFromConversation(this.conversation, this.userInfo._id)
    },
    canEditConv() {
      if (this.hasWriteRight(this.userRightInConv)) {
        return true
      }

      if (this.conversation.organization) {
        return this.isAtLeastMaintainerOfOrganization(
          this.conversation.organization.organizationId,
        )
      }

      return false
    },
    canEditTag() {
      return this.canEditConv
    },
    canReadTag() {
      if (this.hasReadRight(this.userRightInConv)) {
        return true
      }

      if (this.conversation.organization) {
        return this.isInOrganization(this.conversation.organization._id)
      }
    },
    description() {
      return (
        this.conversation.description ||
        this.$t("conversation.description_empty")
      )
    },
    audioDuration() {
      return this.$options.filters.timeToHMS(
        this.conversation?.metadata?.audio?.duration,
      )
    },
    lastUpdate() {
      var options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
      const d = new Date(this.conversation?.last_update)
      return d.toLocaleDateString(undefined, options)
    },
    created() {
      var options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
      const d = new Date(this.conversation?.created)
      return d.toLocaleDateString(undefined, options)
    },
    sharedBy() {
      if (this.conversation.sharedBy) {
        return {
          ...this.conversation.sharedBy,
          img:
            process.env.VUE_APP_PUBLIC_MEDIA +
            "/" +
            this.conversation.sharedBy.img,
          fullName: `${this.conversation.sharedBy.firstname} ${this.conversation.sharedBy.lastname}`,
        }
      }
    },

    convOwner() {
      if (this.conversation.sharedBy) {
        return {
          ...this.conversation.sharedBy,
          img:
            process.env.VUE_APP_PUBLIC_MEDIA +
            "/" +
            this.conversation.sharedBy.img,
          fullName: `${this.conversation.sharedBy.firstname} ${this.conversation.sharedBy.lastname}`,
        }
      }

      const userList = this.$store.state?.currentOrganization?.users ?? []
      const owner = userList.find((u) => u._id == this.conversation.owner)
      if (owner) {
        return {
          fullName: userName(owner),
          img: process.env.VUE_APP_PUBLIC_MEDIA + "/" + owner.img,
        }
      } else {
        return {
          fullName: "Private user",
          img: process.env.VUE_APP_PUBLIC_MEDIA + "/pictures/default.jpg",
        }
      }
    },
    isFavorite() {
      return this.$store.getters.isFavoriteConversation(this.conversation._id)
    },
    _selectedConversation: {
      get() {
        return this.selectedConversations
      },
      set(value) {
        this.$emit("onSelect", {
          value,
          conversation: this.conversation,
        })
      },
    },
    isFromSession() {
      return !!this.conversation?.type?.from_session_id
    },
    editorOptions() {
      if (this.isFromSession) {
        return {
          actions: [
            { value: "overview", text: this.$t("conversation.open_overview") },
            { value: "editor", text: this.$t("conversation.open_overview") },
            { value: "publish", text: this.$t("conversation.open_publish") },
          ],
        }
      }

      return {
        actions: [
          { value: "overview", text: this.$t("conversation.open_overview") },
          { value: "editor", text: this.$t("conversation.open_editor") },
          {
            value: "subtitle_editor",
            text: this.$t("conversation.open_subtitles"),
          },
          { value: "publish", text: this.$t("conversation.open_publish") },
        ],
      }
    },
  },
  watch: {
    tags: function (newTags, oldTags) {},
  },
  methods: {
    selectLine(e) {
      if (e.target.classList.contains("no-propagation")) return
      this.$emit("onSelect", {
        value: null,
        conversation: this.conversation,
      })
    },
    showDropDown(e) {
      this.dropDownVisible = true

      this.dropDownY = e.clientY
      this.dropDownX = e.clientX

      //e.stopPropagation()
    },
    closeDropDown() {
      this.dropDownVisible = false
    },
    toggleFavorite(e) {
      if (this.isFavorite) {
        this.$store.dispatch(
          "removeFavoriteConversation",
          this.conversation._id,
        )
      } else {
        this.$store.dispatch("addFavoriteConversation", this.conversation)
      }
      e.stopPropagation()
    },
    async loadTags() {
      this.loadingTags = true

      let allTags = []

      if (this.indexedTags) {
        allTags = this.getTagsFromIndex()
      } else {
        allTags = await this.getTagsFromApi()
      }

      this.tags = allTags.filter((tag) => {
        return tag && tag.type == "conversation_metadata"
      })
      this.highlightedTags = allTags.filter(
        (tag) => tag && tag.type == "highlight",
      )
      this.originalTags = [...this.tags]
      this.loadingTags = false
    },
    getTagsFromIndex() {
      return this.conversation.tags.map((tagId) => this.indexedTags[tagId])
    },
    async getTagsFromApi() {
      const tagsTree = await apiSearchTagsById(
        this.conversation._id,
        this.conversation.tags,
        "conversation",
      )

      return extractTagsFromCategoryTree(tagsTree)
    },
    async selectTag(tag, category) {
      this.tags.push({
        ...tag,
        color: category.color,
        categoryName: category.name,
      })
      await apiAddTagToConversation(this.conversation._id, tag._id)
    },
    async unSelectTag(tag) {
      this.tags = this.tags.filter((t) => t._id !== tag._id)
      await apiDeleteTagFromConversation(this.conversation._id, tag._id)
    },
    startDescriptionEdition(e) {
      if (this.canEditConv) this.descriptionIsEditing = true
      else this.descriptionIsEditing = false

      //e.stopPropagation()
    },
    stopDescriptionEdition() {
      this.descriptionIsEditing = false
    },
    resetDescriptionEdition() {
      this.descriptionFormData.value = this.conversation.description
      this.descriptionFormData.error = null
      this.stopDescriptionEdition()
    },
    saveNewDescription() {
      apiUpdateConversation(this.conversation._id, {
        description: this.descriptionFormData.value,
      })
      this.conversation.description = this.descriptionFormData.value
      this.stopDescriptionEdition()
    },
    clickOnTag(event, tag) {
      event.stopPropagation()
      this.$emit("clickOnTag", tag)
    },
  },
  components: {
    Tag,
    DropDownAddTag,
    CustomSelect,
    LabeledValueSmall,
    FormInput,
    ContextMenu,
  },
}
</script>
