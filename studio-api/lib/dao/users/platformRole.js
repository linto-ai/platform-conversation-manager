const roles = Object.freeze({
  UNDEFINED: 0,
  USER: 1,
  ORGANIZATION_INITIATOR: 2,
  SESSION_OPERATOR: 4,
  SYSTEM_ADMINISTRATOR: 8,
  SUPER_ADMINISTRATOR: 16,

  defaultUserRole() {
    let defaultRole = process.env.DEFAULT_USER_ROLE || roles.USER
    if (typeof defaultRole === "string") {
      defaultRole = parseInt(defaultRole)
    }
    if (!roles.isValid(defaultRole)) return roles.USER
    return defaultRole
  },

  userRole: function () {
    return roles.USER
  },

  organizationInitiatorRole: function () {
    return roles.USER + roles.ORGANIZATION_INITIATOR
  },

  sessionOperatorRole: function () {
    return roles.USER + roles.SESSION_OPERATOR
  },

  systemAdministratorRole: function () {
    return roles.USER + roles.SYSTEM_ADMINISTRATOR
  },

  superAdministratorRole: function () {
    return (
      roles.USER +
      roles.ORGANIZATION_INITIATOR +
      roles.SESSION_OPERATOR +
      roles.SYSTEM_ADMINISTRATOR +
      roles.SUPER_ADMINISTRATOR
    )
  },

  hasPlatformRoleAccess: function (userRight, desiredRight) {
    return (userRight & desiredRight) === desiredRight
  },

  isValid(role) {
    return (role & roles.superAdministratorRole()) === role
  },

  shiftBitsUp(userRole) {
    let bitsToShift = userRole & ~roles.USER

    bitsToShift = bitsToShift << 1
    return (userRole & roles.USER) | bitsToShift
  },

  shiftBitsDown(userRole) {
    let bitsToShift = userRole & ~roles.USER

    bitsToShift = bitsToShift >> 1
    return (userRole & roles.USER) | bitsToShift
  },

  print(userRole) {
    const sortedRoles = Object.entries(roles).sort((a, b) => b[1] - a[1]) // Sort by value descending

    for (const [role, value] of sortedRoles) {
      if (userRole >= value) {
        return role
      }
    }
    return "UNKNOWN ROLE"
  },
})

module.exports = roles
