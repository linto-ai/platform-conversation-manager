<template>
  <MainContentBackoffice :loading="loading">
    <div class="flex gap-large">
      <div>
        <UpdateOrganizationForm :currentOrganization="organization" />
        <UpdateOrganizationMatchingUsers :currentOrganization="organization" />
        <UpdateOrganizationPermissions :currentOrganization="organization" />
      </div>
      <OrganizationStats :organizationId="organizationId" />
    </div>

    <UpdateOrganizationUsers
      :currentOrganization="organization"
      :userInfo="userInfo" />
    <section>
      <h2 class="medium-margin-bottom">Danger zone</h2>
      <button @click="openDeleteModal" class="btn red-border">
        <span class="icon trash"></span>
        <span class="label">{{ $t("organisation.delete_organization") }}</span>
      </button>
    </section>
    <ModalDeleteOrganization
      v-if="displayDeleteModal"
      :currentOrganization="organization"
      :currentOrganizationScope="organizationId"
      @on-confirm="confirmDeletion"
      @on-cancel="closeDeleteModal" />
  </MainContentBackoffice>
</template>
<script>
import { bus } from "@/main.js"

import { apiGetOrganizationById } from "@/api/organisation.js"
import { platformRoleMixin } from "@/mixins/platformRole.js"

import MainContentBackoffice from "@/components/MainContentBackoffice.vue"
import UpdateOrganizationForm from "@/components/UpdateOrganizationForm.vue"
import UpdateOrganizationUsers from "@/components/UpdateOrganizationUsers.vue"
import ModalDeleteOrganization from "@/components/ModalDeleteOrganization.vue"
import UpdateOrganizationPermissions from "@/components/UpdateOrganizationPermissions.vue"
import UpdateOrganizationMatchingUsers from "@/components/UpdateOrganizationMatchingUsers.vue"
import OrganizationStats from "@/components/OrganizationStats.vue"
export default {
  mixins: [platformRoleMixin],
  props: {
    userInfo: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      organizationId: this.$route.params.organizationId,
      organization: null,
      displayDeleteModal: false,
    }
  },
  mounted() {
    if (!this.isAtLeastSystemAdministrator) {
      this.$router.push({ name: "not_found" })
    }

    bus.$on("user_orga_update", this.fetchOrganization)
    this.fetchOrganization()
  },
  beforeDestroy() {
    bus.$off("user_orga_update", this.fetchOrganization)
  },
  methods: {
    async fetchOrganization() {
      this.loading = true
      this.organization = await apiGetOrganizationById(this.organizationId)
      this.loading = false
    },
    closeDeleteModal() {
      this.displayDeleteModal = false
    },
    openDeleteModal() {
      this.displayDeleteModal = true
    },
    confirmDeletion() {
      this.$router.push({ name: "backoffice-organizationList" })
    },
  },
  components: {
    MainContentBackoffice,
    UpdateOrganizationForm,
    UpdateOrganizationUsers,
    UpdateOrganizationPermissions,
    UpdateOrganizationMatchingUsers,
    ModalDeleteOrganization,
    OrganizationStats,
  },
}
</script>
