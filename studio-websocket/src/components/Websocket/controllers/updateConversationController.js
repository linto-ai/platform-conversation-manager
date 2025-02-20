import Conversations from "../models/conversations.js"
import { v4 as uuidv4 } from "uuid"

export default async function updateConversationController(data) {
  try {
    const deltaId = uuidv4()
    let conversation = Conversations.getById(data.conversationId)

    const delta = data.binaryDelta
    if (!delta) {
      throw "Delta is empty"
    }

    conversation.applyBinaryDelta(
      delta,
      deltaId,
      true,
      (dataApplied) => {
        if (dataApplied) {
          let room = `conversation/${data.conversationId}`
          this.broadcast.to(room).emit("conversation_updated", {
            origin: data.origin,
            delta,
          })
          conversation.deleteUndoManager(deltaId)
        } else {
          this.emit("error")
        }
      },
      data.userToken,
    )
  } catch (error) {
    this.emit("error")
  }
}
