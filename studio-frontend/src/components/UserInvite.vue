<template>
  <div>
    <button
      @click="showList = !showList"
      :class="showList ? 'active' : ''"
      class="invite-user-button">
      <span class="icon plus"></span>
      <span class="label">{{ $t("invite_user.button") }}</span>
    </button>
    <div
      class="select__list invite-user-list"
      v-if="showList"
      v-click-outside="close">
      <div class="flex col select__list__inner">
        <form
          class="form-field flex col small-padding no-margin"
          @submit="inviteUser">
          <label class="form-label" for="dropdown-search-tags">
            {{ $t("invite_user.search_label") }}
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
                  : $t('invite_user.inscription_disabled')
              "
              :disabled="
                this.searchMemberValue.valid && enable_inscription ? null : true
              ">
              <span class="label">{{ $t("invite_user.invite") }}</span>
            </button>
          </div>
        </form>
        <div class="flex col gap-small small-padding">
          <SearchUsersListComponent
            :searchMemberValue="searchMemberValue.value"
            :expanded="true"
            :currentUser="currentUsers"
            v-slot:default="slotProps">
            <button v-if="isPending(slotProps.user)" disabled>
              <span class="icon loading" />
              <span class="label">{{ $t("invite_user.pending") }}</span>
            </button>
            <button
              v-else-if="isAlreadyInvited(slotProps.user)"
              @click="removeUser(slotProps.user)"
              class="red-border">
              <span class="icon remove" />
              <span class="label">
                {{ $t("organisation.user.remove_button") }}</span
              >
            </button>
            <button v-else @click="addUser(slotProps.user)">
              <span class="icon plus" />
              <span class="label">{{ $t("invite_user.add_user") }}</span>
            </button>
          </SearchUsersListComponent>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Fragment } from "vue-fragment"
import { bus } from "../main.js"
import EMPTY_FIELD from "../const/emptyField"
import SearchUsersListComponent from "@/components/SearchUsersList.vue"
import { testEmail } from "@/tools/fields/testEmail"
export default {
  props: {
    usersEmailPending: {
      type: Array,
      default: () => [],
    },
    currentUsers: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      searchMemberValue: {
        ...EMPTY_FIELD,
        value: "",
      },
      showList: false,
    }
  },
  mounted() {},
  watch: {
    "searchMemberValue.value"(value) {
      testEmail(this.searchMemberValue, (key) => this.$t(key))
    },
  },
  computed: {
    enable_inscription() {
      return process.env.VUE_APP_DISABLE_USER_CREATION !== "true"
    },
  },
  methods: {
    inviteUser(event) {
      event.preventDefault()
      this.$emit("inviteUser", { email: this.searchMemberValue.value })
      this.showList = false
      return false
    },
    addUser(user) {
      this.$emit("inviteUser", user)
      return false
    },
    removeUser(user) {
      this.$emit("removeUser", user)
      return false
    },
    close() {
      this.showList = false
    },
    isPending(user) {
      return this.usersEmailPending.includes(user.email)
    },
    isAlreadyInvited(user) {
      return this.currentUsers.find((u) => u.email === user.email)
    },
  },
  components: { Fragment, SearchUsersListComponent },
}
</script>
