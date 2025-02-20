const ROLES = [
  {
    name: "Member",
    value: 1,
  },
  {
    name: "Uploader",
    value: 2,
  },
  {
    name: "Quick meeting",
    value: 3,
  },
  {
    name: "Meeting Manager",
    value: 4,
  },
  {
    name: "Maintainer",
    value: 5,
  },
  {
    name: "Administrator",
    value: 6,
  },
]

const ROLES_INDEXED_BY_VALUE = ROLES.reduce((acc, role) => {
  acc[role.value] = role
  return acc
}, {})

export const orgaRoleMixin = {
  methods: {
    isInOrganization(organizationId) {
      return this.$store.state.rolesInOrganizations.has(organizationId)
    },
    isAtLeastMaintainerOfOrganization(organizationId) {
      if (!this.isInOrganization(organizationId)) return false
      return (
        this.$store.state.rolesInOrganizations.get(organizationId).myrole >= 4
      )
    },
  },
  computed: {
    userRole() {
      return this.$store.getters.getUserRoleInOrganization()
    },
    isMember() {
      return this.userRole === 1
    },
    isUploader() {
      return this.userRole === 2
    },
    isQuickMeeting() {
      return this.userRole === 3
    },
    isMeetingManager() {
      return this.userRole === 4
    },
    isMaintainer() {
      return this.userRole === 5
    },
    isAdmin() {
      return this.userRole === 6
    },
    isAtLeastMember() {
      return this.userRole >= 1
    },
    isAtLeastUploader() {
      return this.userRole >= 2
    },
    isAtLeastQuickMeeting() {
      return this.userRole >= 3
    },
    isAtLeastMeetingManager() {
      return this.userRole >= 4
    },
    isAtLeastMaintainer() {
      return this.userRole >= 5
    },
    maxRoleValue() {
      return 6
    },
    userRoles() {
      return ROLES
    },
    roleToString() {
      if (this.userRole > 6 || this.userRole < 1) return this.$t("Unknown")

      return ROLES_INDEXED_BY_VALUE[this.userRole].name
    },
    userOrganizations() {
      return this.$store.state.userOrganizations
    },
  },
}
