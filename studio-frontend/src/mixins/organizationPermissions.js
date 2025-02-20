export const PERMISSIONS = Object.freeze({
  UNDEFINED: 0,
  UPLOAD: 1,
  SUMMARY: 2,
  SESSION: 4,
})

export const organizationPermissionsMixin = {
  methods: {
    hasNoPermission(permission) {
      return permission === 0
    },
    hasPermission: (userRight, desiredRight) =>
      (userRight & desiredRight) == desiredRight,
    hasUploadPermission(permission) {
      return this.hasPermission(permission, PERMISSIONS.UPLOAD)
    },
    hasSummaryPermission(permission) {
      return this.hasPermission(permission, PERMISSIONS.SUMMARY)
    },
    hasSessionPermission(permission) {
      return this.hasPermission(permission, PERMISSIONS.SESSION)
    },
    computePermissionsNumber({
      upload = false,
      summary = false,
      session = false,
    }) {
      return (
        (upload ? PERMISSIONS.UPLOAD : 0) +
        (summary ? PERMISSIONS.SUMMARY : 0) +
        (session ? PERMISSIONS.SESSION : 0)
      )
    },
  },
  computed: {
    organizationPermissions() {
      return this.$store.state.currentOrganization.permissions
    },
    canUploadInCurrentOrganization() {
      return this.hasUploadPermission(this.organizationPermissions)
    },
    canSummaryInCurrentOrganization() {
      return this.hasSummaryPermission(this.organizationPermissions)
    },
    canSessionInCurrentOrganization() {
      return this.hasSessionPermission(this.organizationPermissions)
    },
  },
}
