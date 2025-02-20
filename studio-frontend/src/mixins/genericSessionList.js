import { bus } from "../main"

// TODO: don't receive event if loading

export const genericSessionList = {
  data() {
    return {
      loading: true,
      error: null,
      sessionList: [],
    }
  },
  mounted() {
    this.fetchSessions()

    if (this.$sessionWS.state.isConnected) {
      this.subscribeToWebsocket()
    }

    bus.$on(
      `websocket/orga_${this.currentOrganizationScope}_session_update`,
      this.onSessionUpdateEvent.bind(this),
    )
  },
  beforeDestroy() {
    this.$sessionWS.unSubscribeOrganization()
    bus.$off(`websocket/orga_${this.currentOrganizationScope}_session_update`)
  },
  methods: {
    subscribeToWebsocket() {
      this.$sessionWS.subscribeOrganization(this.currentOrganizationScope)
    },
    onSessionUpdateEvent(value) {
      const sessionIndexes = {}

      for (const sessionIndex in this.sessionList) {
        const session = this.sessionList[sessionIndex]
        sessionIndexes[session.id] = sessionIndex
      }

      for (const updatedSession of value.updated) {
        console.log("update session", updatedSession)
        const sessionIndex = sessionIndexes[updatedSession.id]
        const currentSession = this.sessionList[sessionIndex]
        this.$set(this.sessionList, sessionIndex, {
          ...currentSession,
          ...updatedSession,
        })
      }
    },
  },
  watch: {
    "$sessionWS.state.isConnected"(newValue, oldValue) {
      if (newValue) {
        this.subscribeToWebsocket()
      }
    },
  },
}
