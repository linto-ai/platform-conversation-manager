import { apiUpdateConversation } from "../../request/index.js"

export async function handleSpeakerChange(
  yEvent,
  transaction,
  conversationId,
  userToken,
) {
  if (transaction.origin == "websocket") {
    return true
  }

  if (yEvent.lenght < 1) {
    return false
  }

  let update = await apiUpdateConversation(
    conversationId,
    { speakers: yEvent[0].currentTarget.toJSON() },
    userToken,
  )

  return update.status === "success"
}
