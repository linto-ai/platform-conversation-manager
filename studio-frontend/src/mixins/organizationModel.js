export const organizationModelMixin = {
  computed: {
    name() {
      return this?.organization?.name ?? ""
    },
    userNumber() {
      return this?.organization?.users?.length ?? 0
    },
    id() {
      return this?.organization?._id ?? ""
    },
    creationDate() {
      return this?.organization?.created ?? ""
    },
    creationDateFormatted() {
      return new Date(this.creationDate).toLocaleDateString()
    },
  },
}
