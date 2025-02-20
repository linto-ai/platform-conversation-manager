import isSessionStarted from "../tools/isSessionStarted"

export const sessionModelMixin = {
  data() {
    return {}
  },
  computed: {
    name() {
      return this?.session?.name ?? ""
    },
    id() {
      return this?.session?.id
    },
    startTime() {
      if (this?.session?.scheduleOn) {
        return new Date(this?.session?.scheduleOn)
      } else {
        return null
      }
    },
    endTime() {
      if (this?.session?.endOn) {
        return new Date(this?.session?.endOn)
      } else {
        return null
      }
    },
    startTimeFormatted() {
      const startTime = this?.session?.scheduleOn

      if (startTime) {
        const options = {
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        }

        return new Date(startTime).toLocaleDateString(undefined, options)
      } else {
        return "–"
      }
    },
    endTimeFormatted() {
      const endTime = this?.session?.endOn

      if (endTime) {
        const options = {
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        }

        return new Date(endTime).toLocaleDateString(undefined, options)
      } else {
        return "–"
      }
    },
    isPending() {
      return this?.session?.status === "ready"
    },
    isStarted() {
      return isSessionStarted(this.session)
    },
    isActive() {
      return this?.session?.status === "active"
    },
    isTerminated() {
      return this?.session?.status === "terminated"
    },
    autoStart() {
      return this?.session?.autoStart ?? false
    },
    autoStop() {
      return this?.session?.autoEnd ?? false
    },
    publicLink() {
      const baseUrl = window.location.origin
      return `${baseUrl}/interface/${this.sessionOrganizationId}/sessions/${this.id}`
    },
    channels() {
      return this?.session?.channels ?? []
    },
    isPublic() {
      return this?.session?.visibility === "public"
    },
    sessionOrganizationId() {
      return this?.session?.organizationId
    },
    conversationId() {
      return this?.session?.conversationId
    },
    room() {
      return this.$t("session.room_undefined")
    },
  },
}
