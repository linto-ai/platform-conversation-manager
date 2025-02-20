import {
  updateTurn as apiUpdateTurn,
  apiUpdateConversation,
} from "../../request/index.js"

export async function handleTextChange(
  yEvent,
  transaction,
  conversationId,
  userToken,
) {
  if (transaction.origin == "websocket") {
    return true
  }

  if ((yEvent.length == 1 && yEvent[0].path.length == 0) || yEvent.length > 1) {
    return await updateAllTurns(yEvent, transaction, conversationId, userToken)
  } else {
    return await updateSpeficTurns(
      yEvent,
      transaction,
      conversationId,
      userToken,
    )
  }
}

async function updateAllTurns(yEvent, transaction, conversationId, userToken) {
  let update = await apiUpdateConversation(
    conversationId,
    { text: yEvent[0].currentTarget.toJSON() },
    userToken,
  )

  return update.status === "success"
}

async function updateSpeficTurns(
  yEvent,
  transaction,
  conversationId,
  userToken,
) {
  let turnToUpdate = {}

  for (const event of yEvent) {
    const turnIndex = event.path[0]
    const turn = event.currentTarget.get(turnIndex).toJSON()
    const turnId = turn.turn_id
    turnToUpdate[turnId] = turn
  }

  const numberTurnToUpdate = Object.keys(turnToUpdate).length
  if (numberTurnToUpdate == 0) {
    return true
  }

  if (numberTurnToUpdate > 1) {
    console.error("More than one turn to update")
    return false
  }

  if (numberTurnToUpdate == 1) {
    const turnId = Object.keys(turnToUpdate)[0]
    let res = await apiUpdateTurn(
      conversationId,
      turnId,
      turnToUpdate[turnId],
      userToken,
    )

    return res.status === "success"
  }

  return false
}
