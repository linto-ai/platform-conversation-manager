import { platformRoleMixin } from "@/mixins/platformRole.js"

export const userModelMixin = {
  mixins: [platformRoleMixin],
  computed: {
    firstname() {
      return this?.user?.firstname ?? ""
    },
    lastname() {
      return this?.user?.lastname ?? ""
    },
    email() {
      return this?.user?.email ?? ""
    },
    id() {
      return this?.user?._id ?? ""
    },
    platformRole() {
      return this?.user?.role ?? 0
    },
    creationDate() {
      return this?.user?.created ?? ""
    },
    creationDateFormatted() {
      return new Date(this.creationDate).toLocaleDateString()
    },
    platformRoleName() {
      switch (true) {
        case this.roleIsSuperAdministrator(this.platformRole):
          return this.$t("platform_role.super_administrator")
        case this.roleIsSystemAdministrator(this.platformRole):
          return this.$t("platform_role.system_administrator")
        case this.roleIsSessionOperator(this.platformRole):
          return this.$t("platform_role.session_operator")
        case this.roleIsOrganizationInitiator(this.platformRole):
          return this.$t("platform_role.organization_initiator")
        default:
          return "–" //this.$t("platform_role.user")
      }
    },
  },
}
