<template>
  <CustomSelect
    class="organization-selector"
    :valueText="name"
    :value="currentOrganizationScope"
    icon="work"
    :iconText="$t('navigation.organisation.title')"
    :aria-label="$t('navigation.organisation.aria_organisations_selector')"
    :options="navOrganizationList"
    @input="onClickMenu" />
</template>
<script>
import { bus } from "../main.js"
import CustomSelect from "./CustomSelect.vue"
import { orgaRoleMixin } from "@/mixins/orgaRole.js"
import { platformRoleMixin } from "@/mixins/platformRole.js"

export default {
  mixins: [orgaRoleMixin, platformRoleMixin],
  props: {
    currentOrganizationScope: { type: String, required: true },
    // userOrganizations: { type: Array, required: true },
    currentOrganization: { type: Object, required: true },
  },
  data() {
    return {
      orgasLoaded: false,
      userOrgasLoaded: false,
      navOrganizationVisible: false,
    }
  },
  mounted() {
    bus.$on("navigation", this.closeMenu)
  },
  beforeDestroy() {
    bus.$off("navigation", this.closeMenu)
  },
  computed: {
    dataLoaded() {
      return this.currentOrganization !== null
    },
    name() {
      if (this.$route.name === "shared with me") {
        return this.$t("navigation.tabs.shared")
      } else if (this.$route.name === "favorites") {
        return this.$t("navigation.tabs.favorites")
      } else if (this.$route.meta.userPage) {
        return this.$t("navigation.tabs.user_page")
      }
      return `${this.currentOrganization.name} (${this.roleToString})`
    },
    navOrganizationList() {
      const organisationItems = this.userOrganizations.map((orga) => {
        return {
          value: orga._id,
          text: `${orga.name}`,
        }
      })
      const settingsItems = [
        {
          value: "settings",
          icon: "settings",
          text: this.$t("navigation.organisation.setting"),
          link: `/interface/organizations/${this.currentOrganizationScope}`,
        },
        {
          value: "tags",
          icon: "tag",
          text: this.$t("navigation.tabs.manage_tags"),
          link: "/interface/tags/settings",
        },
      ]

      if (this.isAtLeastOrganizationInitiator) {
        settingsItems.push({
          value: "create",
          icon: "new",
          text: this.$t("navigation.organisation.create"),
          link: "/interface/organizations/create",
        })
      }
      return {
        organisationItems,
        settingsItems,
      }
    },
  },
  methods: {
    closeMenu() {
      this.navOrganizationVisible = false
    },
    onClickMenu(value) {
      if (value === "settings") {
        this.$router.push(
          `/interface/organizations/${this.currentOrganizationScope}`,
        )
      } else if (value === "create") {
        this.$router.push(`/interface/organizations/create`)
      } else if (value === "tags") {
        this.$router.push(`/interface/tags/settings`)
      } else {
        this.setOrganizationScope(value)
      }
    },
    setOrganizationScope(organizationId) {
      bus.$emit("set_organization_scope", { organizationId })
      this.navOrganizationVisible = false
    },
  },
  components: {
    CustomSelect,
  },
}
</script>
