const PERMISSIONS = Object.freeze({
  NONE: 0,
  UPLOAD: 1,
  SUMMARY: 2,
  SESSION: 4,

  hasRightAccess: (orgaPermission, desiredPermission) =>
    (orgaPermission & desiredPermission) == desiredPermission,

  isValidPermission: (value) => {
    if (value === undefined) return false
    const validPermissions =
      PERMISSIONS.NONE |
      PERMISSIONS.UPLOAD |
      PERMISSIONS.SUMMARY |
      PERMISSIONS.SESSION
    return (value & ~validPermissions) === 0
  },
  getDefaultPermissions() {
    let permissionsSum = PERMISSIONS.NONE // Start with no permissions

    // Check environment variable and calculate the sum of corresponding permissions
    const envPermissions = process.env.ORGANIZATION_DEFAULT_PERMISSIONS
      ? process.env.ORGANIZATION_DEFAULT_PERMISSIONS.split(",")
      : []

    envPermissions.forEach((permission) => {
      const upperPermission = permission.toUpperCase().trim() // Normalize permission key
      if (PERMISSIONS.hasOwnProperty(upperPermission)) {
        permissionsSum |= PERMISSIONS[upperPermission]
      }
    })
    return permissionsSum
  },

  validateAndSetPermissions(value, previousValue) {
    if (this.isValidPermission(value)) return value
    else if (previousValue) return previousValue
    else return this.getDefaultPermissions()
  },
})

module.exports = PERMISSIONS
