import uuid from "uuid/v4"
import conversationsPerPage from "../const/conversationsPerPage"
import { bus } from "@/main.js"

// fetchConversations() is required,
// queryCategoriesUnionSelectedtag() is required if you want to display the tags in the sidebar
export const conversationListMixin = {
  data() {
    const customFilters = this.getCustomFilters()
    return {
      selectedTags: [],
      customFilters: customFilters,
      tagCategoriesUnionSelectedtags: [],
      showExploreModal: false,
      totalElementsNumber: 0,
      currentPageNb: this.getCurrentPageNb(),
      selectedConversations: new Map(),
      selectedConversationsList: [], // Array of selected conversations (more vuejs friendly than a map), used in the template. On refactor, remove the map and use only this array ?
      selectedConversationsSize: 0,
      displayDeleteModal: false,
      conversationsInError: [],
    }
  },
  mounted() {
    localStorage.setItem("listingRoute", this.$route.path)
  },
  beforeRouteEnter(to, from, next) {
    const oldListingRoutePath = localStorage.getItem("listingRoute")
    if (to?.hash !== "#previous") {
      next()
      return
    }

    if (to.path !== oldListingRoutePath && from.path !== oldListingRoutePath) {
      next({ path: oldListingRoutePath })
      return
    }

    next()
  },
  computed: {
    totalPagesNumber() {
      return Math.ceil(this.totalElementsNumber / conversationsPerPage)
    },
    userRights() {
      return this.$store.state.userRights
    },
    noConversations() {
      return this.totalElementsNumber === 0
    },
  },
  watch: {
    selectedTags(value) {
      localStorage.setItem(this.selectedTagsKey, JSON.stringify(value))
      this.queryCategoriesUnionSelectedtag()
      //this.fetchConversations()
    },
    currentPageNb() {
      this.fetchConversations()
      this.addParamsToLocation({ page: this.currentPageNb + 1 })
    },
  },
  methods: {
    getCurrentPageNb() {
      if (this.$route.query.page) {
        return this.$route.query.page - 1
      }

      return 0
    },
    addParamsToLocation(params) {
      const nextPath =
        this.$route.path +
        "?" +
        Object.keys(params)
          .map((key) => {
            return (
              encodeURIComponent(key) + "=" + encodeURIComponent(params[key])
            )
          })
          .join("&")

      history.pushState({}, null, nextPath)
      localStorage.setItem("listingRoute", nextPath)
    },
    onUpdateCustomFilters(filters) {
      this.customFilters = filters
      this.saveCustomFilters()
      this.fetchConversations()
    },
    onUpdateSelectedTags(tags) {
      this.selectedTags = tags
      this.fetchConversations()
    },
    async getSelectedTags() {
      const tagsFromStorage = JSON.parse(
        localStorage.getItem(this.selectedTagsKey)
      )
      if (tagsFromStorage && tagsFromStorage.length > 0) {
        if (this.verifyTags) {
          return await this.verifyTags(tagsFromStorage)
        } else {
          return tagsFromStorage
        }
      }
      return []
    },
    getCustomFilters() {
      if (localStorage.getItem(this.customFiltersKey)) {
        return JSON.parse(localStorage.getItem(this.customFiltersKey))
      }
      return {}
    },
    saveCustomFilters() {
      localStorage.setItem(
        this.customFiltersKey,
        JSON.stringify(this.customFilters)
      )
    },
    onSearchInConversationsTitle(searchText) {
      this.$set(this.customFilters, "titleConversation", {
        title: "Title filter",
        value: searchText,
        _id: uuid(),
        key: "titleConversation",
      })
      this.fetchConversations()
      this.saveCustomFilters()
    },
    onSearchInConversationsText(searchText) {
      this.$set(this.customFilters, "textConversation", {
        title: "Text filter",
        value: searchText,
        _id: uuid(),
        key: "textConversation",
      })
      this.fetchConversations()
      this.saveCustomFilters()
    },
    openExploreModal() {
      this.showExploreModal = true
    },
    closeExploreModal() {
      this.showExploreModal = false
    },
    applyFilters(newSelectedTags) {
      this.selectedTags = newSelectedTags
      this.showExploreModal = false
      this.resetSelectedConversations()
      this.fetchConversations()
    },
    async selectTagFilter(tag, category) {
      this.selectedTags.push({
        ...tag,
        color: category.color,
        categoryName: category.name,
      })
    },
    async unSelectTagFilter(tag) {
      this.selectedTags = this.selectedTags.filter((t) => t._id !== tag._id)
    },
    clickOnTag(tag) {
      if (this.selectedTags.find((t) => t._id === tag._id)) {
        this.selectedTags = this.selectedTags.filter((t) => t._id !== tag._id)
      } else {
        this.selectedTags.push(tag)
      }
      this.resetSelectedConversations()
      this.fetchConversations()
      this.queryCategoriesUnionSelectedtag()
    },
    selectConversation(conversation) {
      const id = conversation._id
      this.selectedConversations.set(id, conversation)
      this.selectedConversationsSize = this.selectedConversations.size
      this.selectedConversationsList = Array.from(
        this.selectedConversations.keys()
      )
    },
    unSelectConversation(id) {
      this.selectedConversations.delete(id)
      this.selectedConversationsSize = this.selectedConversations.size
      this.selectedConversationsList = Array.from(
        this.selectedConversations.keys()
      )
    },
    onSelectConversation({ value, conversation }) {
      const id = conversation._id
      if (this.selectedConversations.has(id)) {
        this.unSelectConversation(id)
      } else {
        this.selectConversation(conversation)
      }
    },
    resetSelectedConversations() {
      this.selectedConversations.clear()
      this.selectedConversationsSize = 0
      this.selectedConversationsList = []
    },
    clickDeleteConvButton() {
      this.conversationsInError = []
      if (this.conversationIsDeletable) {
        for (const conv of this.selectedConversations.values()) {
          if (!this.conversationIsDeletable(conv)) {
            this.conversationsInError.push(conv)
          }
        }
      }
      this.displayDeleteModal = true
    },
    closeDeleteModal() {
      this.displayDeleteModal = false
    },
  },
}
