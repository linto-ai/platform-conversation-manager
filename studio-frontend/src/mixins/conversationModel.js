export const conversationModelMixin = {
  data() {
    return {}
  },
  computed: {
    conversationType() {
      // canonical or child
      return this.conversation?.type?.mode ?? "canonical"
    },
    hasChildConversations() {
      return this.childConversations.length > 0
    },
    childConversations() {
      // return child conversations ids
      return this.conversation?.type?.child_conversations ?? []
    },
    rootConversationId() {
      return this.conversation?.type?.from_parent_id ?? ""
    },
    name() {
      if (this.conversationType === "canonical") {
        return this.conversation?.name
      }

      return this.rootConversation?.name
    },
    canonicalId() {
      if (this.conversationType === "canonical") {
        return this.conversation?._id
      }

      return this.rootConversation?._id
    },
  },
}
