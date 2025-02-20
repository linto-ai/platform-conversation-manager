import { updateScreen, updateSubtitle } from "../../request/index.js"

export async function handleScreenChange(
  yEvent,
  transaction,
  conversationId,
  subtitleId,
  userToken,
) {
  if (transaction.origin === "websocket") return true
  if (yEvent.length > 1) {
    return await updateAllScreens(yEvent, conversationId, subtitleId, userToken)
  } else {
    return await updateSingleScreen(
      yEvent,
      conversationId,
      subtitleId,
      userToken,
    )
  }
}

async function updateAllScreens(yEvent, conversationId, subtitleId, userToken) {
  let update = await updateSubtitle(
    conversationId,
    subtitleId,
    { screens: yEvent[0].currentTarget.toJSON() },
    userToken,
  )

  return update.status === "success"
}

async function updateSingleScreen(
  yEvent,
  conversationId,
  subtitleId,
  userToken,
) {
  let screenToUpdate = []
  for (const event of yEvent) {
    if (event.changes.deleted.size > 0) {
      return updateAllScreens(yEvent, conversationId, subtitleId, userToken)
    }
    const screenIndex = event.path[0]
    const screen = event.currentTarget.get(screenIndex).toJSON()
    screenToUpdate.push(screen)
  }

  const nbOfScreenToUpdate = screenToUpdate.length

  if (nbOfScreenToUpdate > 1) {
    console.error("More than one screen to update")
    return false
  }

  if (nbOfScreenToUpdate === 1) {
    let screen = screenToUpdate[0]
    let res = await updateScreen(
      conversationId,
      subtitleId,
      screen.screen_id,
      screen,
      userToken,
    )

    return res.status === "success"
  }
}
