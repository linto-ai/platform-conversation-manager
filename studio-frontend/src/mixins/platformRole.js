const ROLES = {
  UNDEFINED: 0,
  USER: 1,
  ORGANIZATION_INITIATOR: 2,
  SESSION_OPERATOR: 4,
  SYSTEM_ADMINISTRATOR: 8,
  SUPER_ADMINISTRATOR: 16,
}

export const platformRoleMixin = {
  methods: {
    roleIsUser(role) {
      return (role & ROLES.USER) == ROLES.USER
    },
    roleIsOrganizationInitiator(role) {
      return (
        (role & ROLES.ORGANIZATION_INITIATOR) == ROLES.ORGANIZATION_INITIATOR
      )
    },
    roleIsSessionOperator(role) {
      return (role & ROLES.SESSION_OPERATOR) == ROLES.SESSION_OPERATOR
    },
    roleIsSystemAdministrator(role) {
      return (role & ROLES.SYSTEM_ADMINISTRATOR) == ROLES.SYSTEM_ADMINISTRATOR
    },
    roleIsSuperAdministrator(role) {
      return (role & ROLES.SUPER_ADMINISTRATOR) == ROLES.SUPER_ADMINISTRATOR
    },
    // roles is an object with keys: USER, SESSION_OPERATOR, SYSTEM_ADMINISTRATOR, SUPER_ADMINISTRATOR and values: true or false
    computeRoleValue(roles) {
      let roleValue = 0
      for (const key in roles) {
        if (roles[key] === true) {
          roleValue += ROLES[key]
        }
      }
      return roleValue
    },
  },
  computed: {
    hasNoRole() {
      return this.platformRole === 0
    },
    isUser() {
      return this.roleIsSessionOperator(this.platformRole)
    },
    isOrganizationInitiator() {
      return this.roleIsOrganizationInitiator(this.platformRole)
    },
    isSessionOperator() {
      return this.roleIsSessionOperator(this.platformRole)
    },
    isSystemAdministrator() {
      return this.roleIsSystemAdministrator(this.platformRole)
    },
    isSuperAdministrator() {
      return this.roleIsSuperAdministrator(this.platformRole)
    },
    isAtLeastOrganizationInitiator() {
      return this.platformRole >= ROLES.ORGANIZATION_INITIATOR
    },
    isAtLeastSessionOperator() {
      return this.platformRole >= ROLES.SESSION_OPERATOR
    },
    isAtLeastSystemAdministrator() {
      return this.isSystemAdministrator || this.isSuperAdministrator
    },
    isBackofficePage() {
      return this.$route.meta.backoffice
    },
    platformRole() {
      return this.$store.state.userInfo.role
    },
    roles_dict() {
      return ROLES
    },
  },
}
