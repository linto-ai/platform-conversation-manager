<template>
  <MainContentBackoffice :loading="loading">
    <div class="flex gap-medium">
      <StatCard
        :count="usersCount"
        title="Users"
        icon="profile"
        :to="{ name: 'backoffice-userList' }" />
      <StatCard
        :count="organizationCount"
        title="Organizations"
        icon="work"
        :to="{ name: 'backoffice-organizationList' }" />
    </div>
  </MainContentBackoffice>
</template>
<script>
import { apiGetAllUsers, apiGetAllOrganizations } from "@/api/admin.js"

import { platformRoleMixin } from "@/mixins/platformRole.js"

import MainContentBackoffice from "@/components/MainContentBackoffice.vue"
import StatCard from "@/components/StatCard.vue"
export default {
  mixins: [platformRoleMixin],
  props: {},
  data() {
    return {
      loading: true,
      usersCount: 0,
      organizationCount: 0,
    }
  },
  mounted() {
    if (!this.isAtLeastSystemAdministrator) {
      this.$router.push({ name: "not_found" })
    }
    this.fetchAll()
  },
  methods: {
    async fetchAll() {
      this.loading = true
      await this.countUsers()
      await this.countOrganizations()
      this.loading = false
    },
    async countUsers() {
      const req = await apiGetAllUsers()
      this.usersCount = req.count
    },
    async countOrganizations() {
      const req = await apiGetAllOrganizations()
      this.organizationCount = req.count
    },
  },
  watch: {},
  computed: {},
  components: { MainContentBackoffice, StatCard },
}
</script>
