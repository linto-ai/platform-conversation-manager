<template>
  <section>
    <div class="flex row gap-medium">
      <h2 style="width: auto">{{ $t("organisation.organization_users") }}</h2>
      <UserInvite
        v-if="
          isAtLeastMaintainer || (isSystemAdministrator && isBackofficePage)
        "
        @inviteUser="addToMembers"
        @removeUser="removeFromMembers"
        :currentUsers="orgaMembers"
        :usersEmailPending="usersEmailPending"></UserInvite>
    </div>

    <!--Organization Members -->

    <div v-if="sortedUsers.length > 0" class="flex row">
      <table style="width: 100%">
        <thead>
          <tr>
            <ArrayHeader
              :eventLabel="'user'"
              :label="$t('organisation.user_label')"
              :sortListKey="sortListKey"
              :sortListDirection="sortListDirection"
              @list_sort_by="sortBy" />
            <ArrayHeader
              :eventLabel="'role'"
              :label="$t('organisation.user.role_label')"
              :sortListKey="sortListKey"
              :sortListDirection="sortListDirection"
              @list_sort_by="sortBy" />
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user of sortedUsers"
            :key="user._id"
            :class="userInfo._id === user._id ? 'currentuser' : ''">
            <td>
              <UserInfoInline :user="user" :user-id="user._id" />
            </td>
            <td>
              <select
                v-model="user.role"
                v-if="
                  (isAtLeastMaintainer &&
                    userRole >= user.role &&
                    userInfo._id !== user._id) ||
                  (isSystemAdministrator && isBackofficePage)
                "
                @change="updateUserRole(user)">
                <option
                  v-for="role in userRoles"
                  :key="role.value"
                  :value="role.value"
                  :disabled="
                    userRole < role.value && !isAtLeastSystemAdministrator
                  ">
                  {{ role.name }}
                </option>
              </select>
              <span v-else-if="user.role > maxRoleValue">
                inconsistent role value: {{ user.role }}</span
              >
              <span v-else>{{
                userRoles.find((ur) => ur.value === user.role).name
              }}</span>
            </td>
            <td class="content-size">
              <button
                v-if="userInfo._id === user._id"
                @click="leaveOrganization()">
                {{ $t("organisation.user.leave_button") }}
              </button>
              <button
                v-else-if="
                  (isAtLeastMaintainer &&
                    userRole >= user.role &&
                    userInfo._id !== user._id) ||
                  (isSystemAdministrator && isBackofficePage)
                "
                @click="removeFromMembers(user)"
                class="red-border">
                <span class="icon remove" />
                <span class="label">{{
                  $t("organisation.user.remove_button")
                }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalLeaveOrganization
      v-if="displayLeaveModal"
      :currentOrganization="currentOrganization"
      :currentOrganizationScope="currentOrganizationScope"
      @on-confirm="closeLeaveModal"
      @on-cancel="closeLeaveModal" />

    <ModalRemoveUserFromOrganization
      v-if="displayRemoveUserModal"
      :currentOrganization="currentOrganization"
      :user="userToRemove"
      @on-confirm="closeRemoveFromMembersModal"
      @on-cancel="closeRemoveFromMembersModal" />
  </section>
</template>
<script>
import { bus } from "../main.js"
import EMPTY_FIELD from "@/const/emptyField"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { platformRoleMixin } from "@/mixins/platformRole.js"

import { sortArray } from "@/tools/sortList.js"

import {
  apiAddUserToOrganisation,
  apiUpdateUserRoleInOrganisation,
} from "@/api/user.js"

import UserInvite from "@/components/UserInvite.vue"
import UserInfoInline from "@/components/UserInfoInline.vue"
import ArrayHeader from "@/components/ArrayHeader.vue"
import ModalLeaveOrganization from "@/components/ModalLeaveOrganization.vue"
import ModalRemoveUserFromOrganization from "./ModalRemoveUserFromOrganization.vue"

export default {
  mixins: [orgaRoleMixin, platformRoleMixin],
  props: {
    currentOrganization: {
      type: Object,
      required: true,
    },
    userInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    const orgaMembers = []
    const orgaMembersIds = []

    const users = this.currentOrganization.users || []
    for (let user of users) {
      orgaMembersIds.push(user._id)
      orgaMembers.push(user)
    }
    return {
      userVisibility: {
        ...EMPTY_FIELD,
        value: users.find((usr) => usr._id === this.userInfo._id)?.visibility,
      },
      orgaMembers,
      orgaMembersIds,
      sortListDirection: "asc",
      sortListKey: "user",
      usersEmailPending: [],
      displayLeaveModal: false,
      displayRemoveUserModal: false,
      userToRemove: null,
    }
  },
  computed: {
    userRole() {
      return this.$store.getters.getUserRoleInOrganization()
    },
    sortedUsers() {
      return sortArray(
        this.orgaMembers,
        this.sortListKey,
        this.sortListDirection,
      )
    },
    organizationId() {
      return this.currentOrganization._id
    },
  },
  mounted() {},
  methods: {
    sortBy(key) {
      if (key === this.sortListKey) {
        this.sortListDirection =
          this.sortListDirection === "desc" ? "asc" : "desc"
      } else {
        this.sortListDirection = "desc"
      }
      this.sortListKey = key
    },
    async addToMembers(user) {
      this.usersEmailPending.push(user.email)
      let req = await apiAddUserToOrganisation(
        this.currentOrganization._id,
        user.email,
        1,
        {
          timeout: 3000,
          redirect: false,
        },
      )
      if (req.status === "success") {
        await this.dispatchOrganization()
        this.orgaMembers.push({ ...user, role: 1 })
        this.orgaMembersIds.push(user._id)
        this.searchMemberValue = ""
      }
      this.usersEmailPending = this.usersEmailPending.filter(
        (email) => email !== user.email,
      )
    },
    removeFromMembers(user) {
      this.userToRemove = user
      this.displayRemoveUserModal = true
    },
    closeRemoveFromMembersModal(apiRes) {
      console.log("apiRes", apiRes)
      if (apiRes) {
        if (apiRes.status === "success") {
          const userId = this.userToRemove._id
          let memberIdIndex = this.orgaMembersIds.findIndex(
            (id) => id === userId,
          )
          this.orgaMembersIds.splice(memberIdIndex, 1)

          let memberIndex = this.orgaMembers.findIndex(
            (usr) => usr._id === userId,
          )
          this.orgaMembers.splice(memberIndex, 1)
        } else {
          bus.$emit("app_notif", {
            status: "error",
            message: this.$i18n.t("organisation.remove_user_error_message"),
          })
        }
      }

      this.userToRemove = null
      this.displayRemoveUserModal = false
    },
    leaveOrganization() {
      this.displayLeaveModal = true
    },
    closeLeaveModal(apiRes) {
      if (apiRes) {
        if (apiRes.status === "success") {
          setCookie("cm_orga_scope", "")
          window.location.href = "/"
        } else {
          bus.$emit("app_notif", {
            status: "error",
            message: this.$i18n.t("organisation.leave_error_message"),
          })
        }
      }
      this.displayLeaveModal = false
    },
    imgFullPath(imgPath) {
      return process.env.VUE_APP_PUBLIC_MEDIA + "/" + imgPath
    },
    async updateUserRole(user) {
      let req = await apiUpdateUserRoleInOrganisation(
        this.organizationId,
        user._id,
        user.role,
        {
          timeout: 3000,
          redirect: false,
        },
      )

      if (req.status === "success") {
        await this.dispatchOrganization()
      }
    },

    async dispatchOrganization() {
      bus.$emit("user_orga_update")
    },
  },
  components: {
    UserInvite,
    UserInfoInline,
    ArrayHeader,
    ModalLeaveOrganization,
    ModalRemoveUserFromOrganization,
  },
}
</script>
