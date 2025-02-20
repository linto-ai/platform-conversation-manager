import CONVERSATION_FORMATS from "../const/conversationFormat.js"
import { bus } from "../main.js"
import { workerConnect } from "../tools/worker-message.js"
import { genericConversationMixin } from "./genericConversation.js"
import { apiGetAllCategories } from "../api/tag.js"

export const conversationMixin = {
  mixins: [genericConversationMixin],
  data() {
    return {
      hightlightsCategoriesVisibility: {}, // { category_id: true/false }
    }
  },
  methods: {
    async workerConnect(conversationId, token, userId) {
      await this.fetchHightlightsCategories(conversationId)
      for (const cat of this.hightlightsCategories) {
        this.hightlightsCategoriesVisibility[cat._id] = true
      }
      workerConnect(
        conversationId,
        token,
        userId,
        CONVERSATION_FORMATS.transcription
      )
    },
    async specificWorkerOnMessage(event) {
      switch (event.data.action) {
        case "speaker_name_updated":
          this.updateSpeakerName(
            event.data.params.value.speaker_id,
            event.data.params.value.speaker_name
          )
          bus.$emit("conversation_user_update", { ...event.data.params })
          break
        case "turn_speaker_update":
          this.updateSpeakerTurn(
            event.data.params.turnId,
            event.data.params.value
          )
          bus.$emit("turn_speaker_update", event.data.params)
          break
        case "words_updated":
          bus.$emit("words_updated", {
            ...event.data.params,
          })
          break
        case "segment_updated":
          bus.$emit("segment_updated", {
            ...event.data.params,
          })
          if (event.data.params.origin === "websocket")
            bus.$emit("update_field", {
              ...event.data.params,
              flag: `conversationTurn/${event.data.params.turnId}`,
            })
          break
        case "turn_list_updated":
          this.updateConversationTurns(event.data.params)
          bus.$emit("refresh_turns", {})
          bus.$emit("refresh_spk_timebox", {})
          break
        case "speaker_list_updated":
          this.conversation.speakers = event.data.params.value
          break
        case "keywords_update":
          this.conversation.jobs.nlp = {
            keyword: event.data.params.job ?? { state: "pending" },
          }
          this.conversation.keywords = event.data.params.keywords
          bus.$emit("refresh_keywords", {})
          break
        case "hightlight_update":
          const categoryName = event.data.params.categoryName
          const job = event.data.params.job
          this.conversation.jobs[categoryName] = { ...job }
          if (job.state === "done") {
            this.fetchHightlightsCategories(this.conversationId)
          }
          bus.$emit("hightlight_update", { categoryName })
          break
        case "tag_removed_from_conversation":
          this.fetchHightlightsCategories(this.conversationId)
          break
        default:
          break
      }
    },
    updateConversationTurns(events) {
      this.conversation.text = events.value
      setTimeout(() => {
        bus.$emit("refresh_spk_timebox", {})
      }, 200)
    },
    updateSpeakerName(speakerId, speakerName) {
      this.conversation.speakers.find(
        (spk) => spk.speaker_id === speakerId
      ).speaker_name = speakerName
    },
    updateSpeakerTurn(turnId, speakerId) {
      this.conversation.text.find(
        (turn) => turn.turn_id === turnId
      ).speaker_id = speakerId
    },
    async fetchHightlightsCategories(conversationId) {
      const req = await apiGetAllCategories(
        conversationId,
        "highlight",
        "conversation",
        true,
        true
      )
      this.hightlightsCategories = req.filter(
        (cat) => cat.tags.length > 0 || cat.scope
      )
    },
  },
}
