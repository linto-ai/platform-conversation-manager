<template>
  <div
    class="flex col popover-parent"
    ref="conversation-share"
    v-click-outside="close">
    <button
      @click="showShareList = !showShareList"
      :class="showShareList ? 'active' : ''">
      <span class="icon share"></span>
      <span class="label">{{ $t("share_menu.button") }}</span>
    </button>
    <ContextMenu
      name="share-menu"
      class="conversation-share-list"
      first
      v-if="showShareList"
      overflow
      getContainerSize>
      <div v-if="selectedConversations.size == 0">
        <h3 class="flex row align-center gap-small">
          {{ $t("share_menu.no_conversation_selected_title") }}
        </h3>
        {{ $t("share_menu.no_conversation_selected_content") }}
      </div>
      <div
        v-else-if="loading"
        style="height: 50px"
        class="flex center align-center justify-center">
        <span class="icon loading"></span>
      </div>
      <div v-else-if="conversationsInError.length > 0">
        <div class="flex col gap-small small-padding">
          <h3 class="flex row align-center gap-small">
            <span class="icon warning"></span>
            <span class="label">
              {{ $t("share_menu.conversation_error_title") }}
            </span>
          </h3>
          <div class="flex col gap-small">
            <div
              v-for="conversation in conversationsInError"
              :key="conversation._id"
              class="flex row align-center gap-small">
              <span class="label">{{ conversation.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex col">
        <form
          class="form-field flex col small-padding no-margin conversation-share-list__search-form"
          @submit="inviteUser">
          <label class="form-label" for="dropdown-search-tags">
            {{ $t("share_menu.search_label") }}
          </label>
          <div class="flex row gap-small">
            <input
              type="search"
              class="flex1"
              autocomplete="off"
              v-model="searchMemberValue.value"
              id="dropdown-search-tags" />
            <button
              type="submit"
              class="btn green"
              :title="
                enable_inscription
                  ? null
                  : $t('share_menu.inscription_disabled')
              "
              :disabled="isValidEmail && enable_inscription ? null : true">
              <span class="label">{{
                $t("share_menu.invite_user_button")
              }}</span>
            </button>
          </div>
        </form>
        <!-- Search -->
        <!-- members right -->
        <!-- <div class="flex row small-padding">
          All member (except custom rights setup below):
          <ConversationShareRightSelector
            :value="membersRight"
            :rightsList="rightsList"
            @updateRight="updateOrgaMembersAccess" />
        </div> -->
        <SearchUsersListComponent
          class="small-padding"
          ref="conversation-share-search"
          v-if="searchMemberValue.value"
          :searchMemberValue="searchMemberValue.value"
          :currentUser="[
            ...userRights.organization_members,
            ...userRights.external_members,
          ]"
          v-slot:default="slotProps">
          <ConversationShareRightSelector
            :value="slotProps.user.right"
            @updateRight="
              (newRight) => updateUserRights(slotProps.user, newRight)
            "
            :rightsList="getRightsList(slotProps.user._id)"
            :readOnly="!canUpdateRights(slotProps.user)"
            :isOwner="false" />
        </SearchUsersListComponent>
        <!-- User list of already add users -->
        <div
          class="flex col gap-small small-padding"
          v-if="!searchMemberValue.value">
          <UserList
            :title="$t('share_menu.organization_members')"
            :usersList="userRights.organization_members"
            :expanded="true"
            v-slot:default="slotProps">
            <div
              v-if="usersLoading[slotProps.user._id]"
              style="height: 50px"
              class="flex center align-center justify-center">
              <span class="icon loading"></span>
            </div>
            <ConversationShareRightSelector
              :value="slotProps.user.right"
              @updateRight="
                (newRight) => updateUserRights(slotProps.user, newRight)
              "
              :rightsList="getRightsList(slotProps.user._id)"
              :readOnly="
                !canUpdateRights(slotProps.user) ||
                usersLoading[slotProps.user._id]
              "
              :isOwner="false" />
          </UserList>

          <UserList
            :title="$t('share_menu.external_members')"
            :usersList="userRights.external_members"
            :expanded="true"
            v-slot:default="slotProps">
            <ConversationShareRightSelector
              :value="slotProps.user.right"
              @updateRight="
                (newRight) => updateUserRights(slotProps.user, newRight)
              "
              :rightsList="getRightsList(slotProps.user._id)"
              :readOnly="!canUpdateRights(slotProps.user)"
              :isOwner="false" />
          </UserList>

          <!-- <div class="fixed-notif">
            <div class="app-notif__message">hey ho</div>
          </div> -->
        </div>
      </div>
    </ContextMenu>

    <div
      v-if="false"
      :class="[
        showShareList ? 'visible' : 'hidden',
        'flex',
        'col',
        'conversation-share-list',
      ]">
      <div v-if="selectedConversations.size == 0">
        <h3 class="flex row align-center gap-small">
          {{ $t("share_menu.no_conversation_selected_title") }}
        </h3>
        {{ $t("share_menu.no_conversation_selected_content") }}
      </div>
      <div
        v-else-if="loading"
        style="height: 50px"
        class="flex center align-center justify-center">
        <span class="icon loading"></span>
      </div>
      <div v-else-if="conversationsInError.length > 0">
        <div class="flex col gap-small small-padding">
          <h3 class="flex row align-center gap-small">
            <span class="icon warning"></span>
            <span class="label">
              {{ $t("share_menu.conversation_error_title") }}
            </span>
          </h3>
          <div class="flex col gap-small">
            <div
              v-for="conversation in conversationsInError"
              :key="conversation._id"
              class="flex row align-center gap-small">
              <span class="label">{{ conversation.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex col">
        <form
          class="form-field flex col small-padding no-margin"
          @submit="inviteUser">
          <label class="form-label" for="dropdown-search-tags">
            {{ $t("share_menu.search_label") }}
          </label>
          <div class="flex row gap-small">
            <input
              type="search"
              class="flex1"
              autocomplete="off"
              v-model="searchMemberValue.value"
              id="dropdown-search-tags" />
            <button
              type="submit"
              class="btn green"
              :title="
                enable_inscription
                  ? null
                  : $t('share_menu.inscription_disabled')
              "
              :disabled="isValidEmail && enable_inscription ? null : true">
              <span class="label">{{
                $t("share_menu.invite_user_button")
              }}</span>
            </button>
          </div>
        </form>
        <!-- Search -->
        <!-- members right -->
        <!-- <div class="flex row small-padding">
          All member (except custom rights setup below):
          <ConversationShareRightSelector
            :value="membersRight"
            :rightsList="rightsList"
            @updateRight="updateOrgaMembersAccess" />
        </div> -->
        <SearchUsersListComponent
          class="small-padding"
          ref="conversation-share-search"
          v-if="searchMemberValue.value"
          :searchMemberValue="searchMemberValue.value"
          :currentUser="[
            ...userRights.organization_members,
            ...userRights.external_members,
          ]"
          v-slot:default="slotProps">
          <ConversationShareRightSelector
            :value="slotProps.user.right"
            @updateRight="
              (newRight) => updateUserRights(slotProps.user, newRight)
            "
            :rightsList="getRightsList(slotProps.user._id)"
            :readOnly="!canUpdateRights(slotProps.user)"
            :isOwner="false" />
        </SearchUsersListComponent>
        <!-- User list of already add users -->
        <div
          class="flex col gap-small small-padding"
          v-if="!searchMemberValue.value">
          <UserList
            :title="$t('share_menu.organization_members')"
            :usersList="userRights.organization_members"
            :expanded="true"
            v-slot:default="slotProps">
            <div
              v-if="usersLoading[slotProps.user._id]"
              style="height: 50px"
              class="flex center align-center justify-center">
              <span class="icon loading"></span>
            </div>
            <ConversationShareRightSelector
              :value="slotProps.user.right"
              @updateRight="
                (newRight) => updateUserRights(slotProps.user, newRight)
              "
              :rightsList="getRightsList(slotProps.user._id)"
              :readOnly="
                !canUpdateRights(slotProps.user) ||
                usersLoading[slotProps.user._id]
              "
              :isOwner="false" />
          </UserList>

          <UserList
            :title="$t('share_menu.external_members')"
            :usersList="userRights.external_members"
            :expanded="true"
            v-slot:default="slotProps">
            <ConversationShareRightSelector
              :value="slotProps.user.right"
              @updateRight="
                (newRight) => updateUserRights(slotProps.user, newRight)
              "
              :rightsList="getRightsList(slotProps.user._id)"
              :readOnly="!canUpdateRights(slotProps.user)"
              :isOwner="false" />
          </UserList>

          <!-- <div class="fixed-notif">
            <div class="app-notif__message">hey ho</div>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import RIGHTS_LIST from "@/const/rigthsList.js"
import EMPTY_FIELD from "@/const/emptyField.js"

import {
  apiGetUsersFromMultipleConversation,
  apiInviteInConversation,
} from "../api/conversation.js"
import { apiUpdateMultipleUsersInMultipleConversations } from "../api/user.js"

import { bus } from "../main.js"
import { getUserRightFromConversation } from "@/tools/getUserRightFromConversation.js"
import { indexConversationRightByUsers } from "@/tools/indexConversationRightByUsers.js"

import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { convRoleMixin } from "@/mixins/convRole.js"
import { debounceMixin } from "@/mixins/debounce.js"

import UserInfoInline from "./UserInfoInline.vue"
import UserList from "./UserList.vue"
import ConversationShareRightSelector from "./ConversationShareRightSelector.vue"
import SearchUsersListComponent from "@/components/SearchUsersList.vue"
import ContextMenu from "@/components/ContextMenu.vue"

export default {
  props: {
    userInfo: { type: Object, required: true },
    selectedConversations: { type: Map, required: true },
    currentOrganizationScope: { type: String, required: true },
    // conversation: { type: Object, required: true },
    // conversationId: { type: String, required: true },
    // userRight: { type: Number, required: true },
  },
  mixins: [debounceMixin, orgaRoleMixin, convRoleMixin],
  data() {
    return {
      showShareList: false,
      loading: false,
      conversationsInError: [],
      searchMemberValue: {
        ...EMPTY_FIELD,
        value: "",
      },
      usersRightsIndexed: {}, // { organization_members: map([[userid, {userObj}],...]), external_members: map([[userid, {userObj}],...])}
      userRights: {}, // {[organization_members: {userObj1}, {userObj2}, ...], external_members: [...]}, because SearchUsersListComponent need array and not map (for the moment, to be refactored)
      usersRightsFreezed: {},
      usersLoading: {},
    }
  },
  async mounted() {},
  computed: {
    rightsList() {
      return RIGHTS_LIST((key) => this.$i18n.t(key))
    },
    rightsListWithMultiple() {
      return [
        ...RIGHTS_LIST((key) => this.$i18n.t(key), true),
        {
          value: -1,
          txt: this.$i18n.t("conversation.members_right_txt.mutiple_values"),
        },
      ]
    },
    isValidEmail() {
      return this.searchMemberValue.value.indexOf("@") > 0
    },
    enable_inscription() {
      return process.env.VUE_APP_DISABLE_USER_CREATION !== "true"
    },
  },
  watch: {
    async showShareList() {
      if (this.showShareList) {
        this.loading = true
        this.verifyConversationsList()
        if (
          this.selectedConversations.size > 0 &&
          this.conversationsInError.length == 0
        ) {
          await this.loadUsersRights()
        }
        this.loading = false
      }
    },
  },
  methods: {
    close() {
      this.showShareList = false
    },
    verifyConversationsList() {
      this.conversationsInError = []
      for (const conv of this.selectedConversations.values()) {
        if (!this.conversationCanBeShared(conv)) {
          this.conversationsInError.push(conv)
        }
      }
    },
    conversationCanBeShared(conversation) {
      const userRight = getUserRightFromConversation(conversation)

      if (this.hasDeleteRight(userRight)) {
        return true
      }

      if (this.isAtLeastMaintainer) {
        return true
      }

      return false
    },
    async inviteUser(event) {
      event.preventDefault()
      const convIds = Array.from(this.selectedConversations.values()).map(
        (c) => c._id,
      )
      let res = await apiUpdateMultipleUsersInMultipleConversations(
        convIds,
        [{ email: this.searchMemberValue.value, right: 1 }],
        this.currentOrganizationScope,
        {
          message: this.$t("share_menu.user_has_been_invited"),
        },
      )
      await this.resetSearch()
      return false
    },
    async updateUserRights(user, newRight) {
      // todo: websocket update (until then, other users will have to reload the page)
      if (this.usersLoading?.[user._id]) return

      this.$set(this.usersLoading, user._id, true)

      let newUser
      if (newRight == -1) {
        // revert thanks to freezed object
        return
      } else {
        newUser = {
          id: user._id,
          right: newRight,
        }
      }

      let res = await apiUpdateMultipleUsersInMultipleConversations(
        Array.from(this.selectedConversations.keys()),
        [newUser],
        this.currentOrganizationScope,
        null,
      )

      if (res.status === "success") {
        bus.$emit("app_notif", {
          status: "success",
          message: this.$t("share_menu.user_right_updated"),
          redirect: false,
        })
        await this.resetSearch()
      } else {
        console.error("error", res)
      }

      this.$set(this.usersLoading, user._id, false)
    },
    async loadUsersRights() {
      const listOfconvRights = await apiGetUsersFromMultipleConversation(
        Array.from(this.selectedConversations.keys()),
      )
      this.usersRightsFreezed = Object.freeze(listOfconvRights)
      this.usersRightsIndexed = indexConversationRightByUsers(listOfconvRights)
      this.userRights = {
        organization_members: Array.from(
          this.usersRightsIndexed.organization_members.values(),
        ),
        external_members: Array.from(
          this.usersRightsIndexed.external_members.values(),
        ),
      }
    },
    getRightsList(userId) {
      const userInternal =
        this.usersRightsIndexed.organization_members.get(userId)
      const userExternal = this.usersRightsIndexed.external_members.get(userId)
      if (userExternal?.right == -1 || userInternal?.right == -1) {
        return this.rightsListWithMultiple
      }
      return this.rightsList
    },
    canUpdateRights(user) {
      return true // TODO
    },
    async resetSearch() {
      await this.loadUsersRights()
      this.searchMemberValue.value = ""
    },
  },
  components: {
    SearchUsersListComponent,
    UserInfoInline,
    UserList,
    ConversationShareRightSelector,
    ContextMenu,
  },
}
</script>
