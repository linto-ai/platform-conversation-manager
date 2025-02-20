<template>
  <MainContentBackoffice>
    <template v-slot:header>
      <HeaderTable
        v-bind:search.sync="search"
        @on-delete="showModalDeleteUsers"
        @on-create="showModalAddUser"
        :title="$t('backoffice.user_list.title')"
        :count="count"
        :disableDelete="selectedUsers.length === 0"
        :remove_button_label="
          $tc('backoffice.user_list.remove_user_button', selectedUsers.length)
        "
        :add_button_label="
          $t('backoffice.user_list.add_user_button')
        "></HeaderTable>
    </template>

    <div class="backoffice-listing-container">
      <UserTable
        :loading="loading"
        :users="users"
        :sortListKey="sortListKey"
        :sortListDirection="sortListDirection"
        @list_sort_by="sortBy"
        :linkTo="{ name: 'backoffice-userDetail' }"
        v-model="selectedUsers" />
    </div>
    <Pagination
      v
      :pages="totalPagesNumber"
      v-model="currentPageNb"
      v-if="count > 0 && !loading"></Pagination>
    <ModalDeleteUsers
      @on-close="hideModalDeleteUsers"
      @on-confirm="reload"
      :selectedUsers="selectedUsers"
      v-if="modalDeleteUsersIsVisible"></ModalDeleteUsers>

    <ModalCreateUser
      @on-confirm="reload"
      @on-close="hideModalAddUser"
      v-if="modalAddUserIsVisible"></ModalCreateUser>
  </MainContentBackoffice>
</template>
<script>
import { platformRoleMixin } from "@/mixins/platformRole.js"
import { apiGetAllUsers } from "@/api/admin.js"
import { debounceMixin } from "@/mixins/debounce.js"

import MainContentBackoffice from "@/components/MainContentBackoffice.vue"
import UserTable from "@/components/UserTable.vue"
import HeaderTable from "@/components/HeaderTable.vue"
import ModalDeleteUsers from "@/components/ModalDeleteUsers.vue"
import Pagination from "@/components/Pagination.vue"
import ModalCreateUser from "@/components/ModalCreateUser.vue"

export default {
  mixins: [platformRoleMixin, debounceMixin],
  props: {},
  data() {
    return {
      loading: true,
      users: [],
      count: 0,
      selectedUsers: [],
      modalDeleteUsersIsVisible: false,
      modalAddUserIsVisible: false,
      currentPageNb: 0,
      totalPagesNumber: 0,
      search: "",
      sortListKey: "email",
      sortListDirection: "asc",
    }
  },
  mounted() {
    if (!this.isAtLeastSystemAdministrator) {
      this.$router.push({ name: "not_found" })
    }
    this.debouncedFetchAllUsers()
  },
  methods: {
    async fetchAllUsers() {
      return await apiGetAllUsers(
        this.currentPageNb,
        {
          sortField: this.sortListKey,
          sortOrder: this.sortListDirection === "asc" ? 1 : -1,
        },
        this.search,
      )
    },
    async debouncedFetchAllUsers() {
      this.loading = true
      const req = await this.debouncedSearch(
        this.fetchAllUsers.bind(this),
        this.search,
      )
      this.users = req.list
      this.count = req.count
      this.totalPagesNumber = Math.ceil(req.count / 10)
      this.loading = false
    },
    showModalDeleteUsers() {
      this.modalDeleteUsersIsVisible = true
    },
    showModalAddUser() {
      this.modalAddUserIsVisible = true
    },
    hideModalDeleteUsers() {
      this.modalDeleteUsersIsVisible = false
    },
    hideModalAddUser() {
      this.modalAddUserIsVisible = false
    },
    reload() {
      this.hideModalDeleteUsers()
      this.hideModalAddUser()
      this.debouncedFetchAllUsers()
      this.selectedUsers = []
    },
    sortBy(key) {
      if (key === this.sortListKey) {
        this.sortListDirection =
          this.sortListDirection === "desc" ? "asc" : "desc"
      } else {
        this.sortListDirection = "desc"
      }
      this.sortListKey = key
      this.debouncedFetchAllUsers()
    },
  },
  computed: {},
  watch: {
    currentPageNb() {
      this.debouncedFetchAllUsers()
    },
    search() {
      this.debouncedFetchAllUsers()
    },
  },
  components: {
    MainContentBackoffice,
    UserTable,
    HeaderTable,
    ModalDeleteUsers,
    ModalCreateUser,
    Pagination,
  },
}
</script>
