<template>
  <MainContent sidebar box>
    <OrganizationCreateHelper
      :showHelper="helperVisible"
      @close="closeHelper()"></OrganizationCreateHelper>

    <template v-slot:breadcrumb-actions>
      <button class="btn" @click="showHelper()" style="min-width: 80px">
        <span class="icon help"></span>
        <span class="label">{{
          $t("conversation.transcription_help.help_button_label")
        }}</span>
      </button>
    </template>

    <section class="flex row">
      <!-- LEFT PART -->
      <form class="flex col flex1" @submit="createOrganization">
        <h2>{{ $t("organisation.create.title") }}</h2>
        <!--Organization Name -->
        <div class="form-field flex col">
          <label class="form-label" for="orgaName">
            {{ $t("organisation.name_label") }}
          </label>
          <input
            type="text"
            v-model="orgaName.value"
            :class="orgaName.error !== null ? 'error' : ''"
            id="orgaName" />
          <span class="error-field" v-if="orgaName.error !== null">{{
            orgaName.error
          }}</span>
        </div>
        <!--Organization Descirption -->
        <div class="form-field flex col">
          <label class="form-label" for="orgaDescription">
            {{ $t("organisation.description_label") }}
          </label>
          <input
            type="text"
            v-model="orgaDescription.value"
            id="orgaDescription" />
        </div>

        <!--Organization Members 
        <search-users-list-component
          :label="$t('organisation.add_member_label')"
          :sendInviteMail="false"
          @selectUser="addToMembers"
          :currentUser="[
            ...orgaMembersIds.map((id) => ({
              _id: id,
            })),
            userInfo,
          ]" />
        <div v-if="sortedUsers.length > 0" class="flex row">
          <table>
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
                <th>{{ $t("organisation.user.remove_label") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member of sortedUsers" :key="member._id">
                <td>
                  <div class="flex row align-center">
                    <img
                      :src="imgFullPath(member.img)"
                      class="search-member-img" />
                    <span class="search-member-identity">
                      {{ member.firstname }} {{ member.lastname }}
                      <i>({{ member.email }})</i>
                    </span>
                  </div>
                </td>
                <td>
                  <select v-model="member.role">
                    <option
                      v-for="role in userRoles"
                      :key="role.value"
                      :value="role.value">
                      {{ role.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <button @click="removeFromMembers(member)">
                    {{ $t("organisation.user.remove_button") }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>-->
        <div class="flex row">
          <button class="btn green" type="submit" :disabled="buttonDisabled">
            <span class="icon apply"></span>
            <span class="label">{{ formSubmitLabel }}</span>
          </button>
        </div>
      </form>
    </section>
  </MainContent>
</template>
<script>
import { apiCreateOrganisation } from "../api/organisation.js"
import { bus } from "../main.js"
import SearchUsersListComponent from "@/components/SearchUsersList.vue"
import { sortArray } from "../tools/sortList.js"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"

import ArrayHeader from "@/components/ArrayHeader.vue"
import OrganizationCreateHelper from "@/components/OrganizationCreateHelper.vue"
import MainContent from "@/components/MainContent.vue"
import { testContent } from "@/tools/fields/testContent.js"
import { testName } from "@/tools/fields/testName.js"

export default {
  mixins: [orgaRoleMixin],
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      orgaName: {
        value: "",
        error: null,
        valid: false,
      },
      orgaDescription: {
        value: "",
        error: null,
        valid: false,
      },

      orgaMembers: [],
      orgaMembersIds: [],
      formSubmitLabel: this.$i18n.t("organisation.create.submit_label"),
      formState: "available",
      sortListDirection: "asc",
      sortListKey: "user",
      helperVisible: false,
      buttonDisabled: false,
    }
  },
  computed: {
    sortedUsers() {
      return sortArray(
        this.orgaMembers,
        this.sortListKey,
        this.sortListDirection,
      )
    },
  },
  methods: {
    showHelper() {
      this.helperVisible = true
    },
    closeHelper() {
      this.helperVisible = false
    },
    sortBy(key) {
      if (key === this.sortListKey) {
        this.sortListDirection =
          this.sortListDirection === "desc" ? "asc" : "desc"
      } else {
        this.sortListDirection = "desc"
      }
      this.sortListKey = key
    },
    resetForm() {
      this.formState = "available"
      this.formSubmitLabel = this.$i18n.t("organisation.create.submit_label")
      this.buttonDisabled = false
    },
    async createOrganization(event) {
      event?.preventDefault()
      if (this.formState === "available") {
        // test name field
        testName(this.orgaName, (key) => this.$t(key))

        // test description
        testContent(this.orgaDescription, (key) => this.$t(key))

        // form valid
        if (this.orgaName.valid) {
          try {
            this.formSubmitLabel = "Processing..."
            this.formState = "sending"
            this.buttonDisabled = true
            let users = []
            for (let user of this.orgaMembers) {
              users.push({
                userId: user._id,
                role: user.role,
              })
            }
            let payload = {
              name: this.orgaName.value.trim(),
              description: this.orgaDescription.value,
              users,
            }
            let req = await apiCreateOrganisation(payload)

            if (req.status === "success") {
              this.formState = req.status
              let newOrganizationId = req.data._id
              bus.$emit("set_organization_scope", {
                organizationId: newOrganizationId,
              })
              bus.$emit("app_notif", {
                status: "success",
                message: this.$i18n.t("organisation.create.success_message"),
                redirect: false,
              })
            } else if (req.status === "error") {
              this.handleError(req)
            }
          } catch (error) {
            if (process.env.VUE_APP_DEBUG === "true") {
              console.error(error)
            }
            this.handleError()
          }
        }
      }
      return false
    },
    handleError(req) {
      switch (req?.error?.response?.status) {
        case 409:
          bus.$emit("app_notif", {
            status: "error",
            message: this.$i18n.t("organisation.create.error_already_exists"),
            redirect: false,
          })

          break
        default:
          bus.$emit("app_notif", {
            status: "error",
            message: this.$i18n.t("organisation.create.error_message"),
            redirect: false,
          })
      }
      this.formState = "available"
      this.resetForm()
    },
    addToMembers(user) {
      this.orgaMembersIds.push(user._id)
      let userOrga = user
      userOrga.role = 1
      this.orgaMembers.push(user)
      this.searchMemberValue = ""
    },
    removeFromMembers(user) {
      let memberIdIndex = this.orgaMembersIds.findIndex((id) => id === user._id)
      this.orgaMembersIds.splice(memberIdIndex, 1)

      let memberIndex = this.orgaMembers.findIndex(
        (usr) => usr._id === user._id,
      )
      this.orgaMembers.splice(memberIndex, 1)
    },
    imgFullPath(imgPath) {
      return process.env.VUE_APP_PUBLIC_MEDIA + "/" + imgPath
    },
  },
  components: {
    SearchUsersListComponent,
    ArrayHeader,
    OrganizationCreateHelper,
    MainContent,
  },
}
</script>
