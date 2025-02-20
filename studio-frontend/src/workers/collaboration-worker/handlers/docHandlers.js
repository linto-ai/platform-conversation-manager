import { Conversation } from "../models/conversations.js"
import { Subtitle } from "../models/subtitles.js"
import debounce from "debounce"
import { customDebug } from "../../../tools/customDebug"

const debugSendDocUpdate = customDebug("Worker:debug:send:docUpdate")
const debugReceiveTurnUpdate = customDebug("Worker:debug:receive:turnUpdate")
const debugReceiveSpeakerUpdate = customDebug(
  "Worker:debug:receive:speakerUpdate"
)

let tmpBinaryDelta = []

export function sendDocUpdateToWebsocketWrapper(socket, dataId, userToken) {
  const debounceFunc = debounce(sendDocUpdateToWebsocket, 300)
  return (binaryDelta, origin) => {
    if (origin == "websocket") return
    debugSendDocUpdate("Push updates")
    tmpBinaryDelta.push(binaryDelta)

    return debounceFunc(origin, socket, dataId, userToken)
  }
}

export function sendSpeakersUpdateToViewWrapper(sendMessage, conversation) {
  return (YEvent, transaction) =>
    sendSpeakersUpdateToView(sendMessage, conversation, YEvent, transaction)
}

export function sendOrgaUpdateToViewWrapper(sendMessage, conversation) {
  return (YEvent, transaction) =>
    sendOrgaUpdateToView(sendMessage, conversation, YEvent, transaction)
}

export function sendDescriptionUpdateToViewWrapper(sendMessage, conversation) {
  return (YTextEvent, transaction) =>
    sendDescriptionUpdateToView(
      sendMessage,
      conversation,
      YTextEvent,
      transaction
    )
}

export function sendNameUpdateToViewWrapper(sendMessage, conversation) {
  return (YTextEvent, transaction) =>
    sendNameUpdateToView(sendMessage, conversation, YTextEvent, transaction)
}

export function sendTextUpdateToViewWrapper(sendMessage, conversation) {
  return (YTextEvent, transaction) => {
    sendTextUpdateToView(sendMessage, conversation, YTextEvent, transaction)
  }
}

export function sendScreenUpdateToViewWrapper(sendMessage, subtitle) {
  return (YtextEvent, transaction) => {
    sendScreenUpdateToView(sendMessage, subtitle, YtextEvent, transaction)
  }
}

function sendDocUpdateToWebsocket(origin, socket, dataId, userToken) {
  debugSendDocUpdate("Merge updates")
  let isSubtitle = origin.startsWith("subtitle")

  // Merge all binary deltas
  let mergedDelta = isSubtitle
    ? Subtitle.mergeUpdates(tmpBinaryDelta)
    : Conversation.mergeUpdates(tmpBinaryDelta)
  // Reset Temporary binary delta
  tmpBinaryDelta = []
  // Send binary delta to worker
  debugSendDocUpdate("Send binary delta to WS")
  socket.emit(`${isSubtitle ? "screen" : "conversation"}_update`, {
    subtitleId: isSubtitle ? dataId : undefined,
    conversationId: !isSubtitle ? dataId : undefined,
    userToken,
    binaryDelta: mergedDelta,
    origin,
  })
}

function sendSpeakersUpdateToView(
  sendMessage,
  conversation,
  YEvent,
  transaction
) {
  for (const event of YEvent) {
    if (event.childListChanged) {
      sendSpeakerNameUpdateToView(
        sendMessage,
        conversation,
        YEvent,
        transaction
      )
    } else {
      sendSpeakersListUpdateToView(
        sendMessage,
        conversation,
        YEvent,
        transaction
      )
    }
  }
}

function sendNameUpdateToView(
  sendMessage,
  conversation,
  YTextEvent,
  transaction
) {
  if (transaction.origin == "websocket") {
    debugReceiveSpeakerUpdate(
      "name update: delta %o",
      YTextEvent?.changes?.delta
    )
    const title = conversation.getYdoc().getText("name").toString()
    sendMessage("title_updated", {
      value: title,
      conversationId: conversation.getObj()._id,
      delta: YTextEvent.changes.delta,
    })
  }
}

function sendSpeakersListUpdateToView(
  sendMessage,
  conversation,
  event,
  transaction
) {
  debugReceiveSpeakerUpdate(
    "spk list update: value %o",
    conversation?.getSpeakers()
  )
  sendMessage("speaker_list_updated", {
    value: conversation.getSpeakers(),
    conversationId: conversation.getObj()._id,
  })
}

function sendDescriptionUpdateToView(
  sendMessage,
  conversation,
  YTextEvent,
  transaction
) {
  if (transaction.origin == "websocket") {
    const description = conversation.getYdoc().getText("description").toString()
    sendMessage("description_updated", {
      value: description,
      conversationId: conversation.getObj()._id,
      delta: YTextEvent.changes.delta,
    })
  }
}

function sendSpeakerNameUpdateToView(
  sendMessage,
  conversation,
  YTextEvent,
  transaction
) {
  const speakers = conversation.getYdoc().getArray("speakers").toJSON()
  let value = YTextEvent[0].target._item.parent.toJSON()
  sendMessage("speaker_name_updated", {
    conversationId: conversation.getObj()._id,
    delta: YTextEvent[0].changes.delta,
    value,
    speakers,
    origin: transaction.origin,
  })
}

function sendOrgaUpdateToView(
  sendMessage,
  conversation,
  YTextEvent,
  transaction
) {
  if (transaction.origin == "websocket") {
    sendMessage("conv_orga_updated", {
      value: conversation.getConversationOrga(),
      conversationId: conversation.getObj()._id,
    })
  }
}

function sendTextUpdateToView(sendMessage, conversation, YEvent, transaction) {
  for (const event of YEvent) {
    const { path } = event
    if (path.length == 0)
      sendTurnsListUpdate(sendMessage, conversation, event, transaction)

    if (path.length == 1) {
      const turnIndex = path[0]
      event.changes.keys.forEach((_, changed_key) => {
        switch (changed_key) {
          case "speaker_id":
            sendTurnSpeakerUpdate(
              sendMessage,
              conversation,
              event,
              transaction,
              turnIndex
            )
            break

          default:
            break
        }
      })
    }

    if (path.length == 2) {
      const turnIndex = path[0]
      switch (path[1]) {
        case "segment":
          sendSegmentUpdate(
            sendMessage,
            conversation,
            event,
            transaction,
            turnIndex
          )
          break
        case "words":
          sendWordsUpdate(
            sendMessage,
            conversation,
            event,
            transaction,
            turnIndex
          )
          break
        case "speaker_id":
          console.log("need update speaker ")
          break
        default:
          break
      }
    }
  }

  if (transaction.origin == "websocket") {
    return
  }
}

function sendWordsUpdate(
  sendMessage,
  conversation,
  event,
  transaction,
  turnIndex
) {
  debugReceiveTurnUpdate(
    "Words update: id %o, value '%o'",
    conversation.getConversationText()[turnIndex].turn_id,
    conversation.getConversationText()[turnIndex].words
  )
  sendMessage("words_updated", {
    conversationId: conversation.getObj()._id,
    turnIndex,
    turnId: conversation.getConversationText()[turnIndex].turn_id,
    delta: event.changes.delta,
    value: conversation.getConversationText()[turnIndex].words,
    origin: transaction.origin,
  })
}

function sendSegmentUpdate(
  sendMessage,
  conversation,
  event,
  transaction,
  turnIndex
) {
  debugReceiveTurnUpdate(
    "Segment update: id %o, value '%s'",
    conversation.getConversationText()[turnIndex].turn_id,
    conversation.getConversationText()[turnIndex].segment
  )
  sendMessage("segment_updated", {
    conversationId: conversation.getObj()._id,
    turnIndex,
    turnId: conversation.getConversationText()[turnIndex].turn_id,
    delta: event.changes.delta,
    value: conversation.getConversationText()[turnIndex].segment,
    origin: transaction.origin,
  })
}

function sendTurnsListUpdate(sendMessage, conversation, event, transaction) {
  debugReceiveTurnUpdate(
    "Turns list update: delta %o, value '%o'",
    event?.changes?.delta,
    conversation?.getConversationText()
  )
  const delta = JSON.parse(JSON.stringify(event.changes.delta))

  const data = {
    conversationId: conversation.getObj()._id,
    delta,
    value: conversation.getConversationText(),
    origin: transaction.origin,
  }
  sendMessage("turn_list_updated", data)
}

function sendTurnSpeakerUpdate(
  sendMessage,
  conversation,
  event,
  transaction,
  turnIndex
) {
  debugReceiveTurnUpdate(
    "Segment speaker update: id %o, value '%s'",
    conversation.getConversationText()[turnIndex].turn_id,
    conversation.getConversationText()[turnIndex].speaker_id
  )
  sendMessage("turn_speaker_update", {
    conversationId: conversation.getObj()._id,
    turnIndex,
    turnId: conversation.getConversationText()[turnIndex].turn_id,
    value: conversation.getConversationText()[turnIndex].speaker_id,
    origin: transaction.origin,
  })
}

function sendScreenUpdateToView(sendMessage, subtitle, events, transaction) {
  let updateScreen = false,
    mergeScreen = false,
    splitScreen = false,
    addScreen = false,
    deleteScreen = false
  for (const event of events) {
    // console.log(event.path)
    // console.log(event.changes)
    if (event.path.length > 0) {
      updateScreen = true
    } else if (event.changes.added.size > 0) {
      addScreen = true
    } else if (event.changes.deleted.size > 0) {
      deleteScreen = true
    }
    mergeScreen = deleteScreen && updateScreen
    splitScreen = addScreen && updateScreen
  }

  // console.log("merge: " + mergeScreen)
  // console.log("delete: " + deleteScreen)
  // console.log("split: " + splitScreen)
  // console.log("add: " + addScreen)
  // console.log("update: " + updateScreen)

  if (mergeScreen) sendScreenMergeToView(sendMessage, subtitle, events)
  else if (deleteScreen) {
    sendScreenDeleteToView(sendMessage, subtitle, events, transaction.origin)
  } else if (splitScreen) console.log("split")
  else if (addScreen)
    sendScreenAddToView(sendMessage, subtitle, events[0], transaction.origin)
  else if (updateScreen)
    sendScreenContentUpdateToView(
      sendMessage,
      subtitle,
      events[0],
      transaction.origin
    )
}

function sendScreenDeleteToView(sendMessage, subtitle, events, origin) {
  if (origin !== "websocket") return
  const delta = events[0].changes.delta
  sendMessage("screen_delete", {
    delta,
  })
}

function sendScreenMergeToView(sendMessage, subtitle, events) {
  let modifiedScreenId = ""
  let modifiedIndex = -1
  let deletedIndex = -1
  for (const event of events) {
    if (event.path.length > 0) {
      let screen = subtitle.getScreen(event.path[0])
      modifiedScreenId = screen.screen_id
      modifiedIndex = event.path[0]
    } else {
      for (const delta of event.changes.delta) {
        if (delta.retain) deletedIndex = delta.retain
      }
    }
  }

  let deleteAfter = deletedIndex === modifiedIndex + 1

  sendMessage("merge_screen", {
    screenId: modifiedScreenId,
    deleteAfter,
  })
}

function sendScreenContentUpdateToView(sendMessage, subtitle, event, origin) {
  if (origin !== "websocket") return

  if (event.path.length === 0) return

  if (event.path.length === 1) {
    let screen = subtitle.getScreen(event.path[0])
    let screenId = screen.screen_id
    let changes = {}
    for (const [key, _] of event.changes.keys) {
      changes[key] = screen[key]
    }

    sendMessage("screen_update", {
      screenId: screenId,
      changes: changes,
    })
  }

  if (event.path.length === 2 && event.path[1] === "text") {
    let screen = subtitle.getScreen(event.path[0])
    let screenId = screen.screen_id
    let changes = {}

    sendMessage("screen_update", {
      screenId: screenId,
      changes: { text: screen.text },
    })
  }
}

function sendScreenAddToView(sendMessage, subtitle, event, origin) {
  if (origin !== "websocket") return

  let delta = event.changes.delta
  let after = true
  let screenId = ""

  if (delta[0].retain) {
    let index = delta[0].retain - 1
    screenId = subtitle.getScreen(index).screen_id
  } else {
    // insert at 0 => insert new screen before the current 1st screen
    after = false
    screenId = subtitle.getScreen(1).screen_id
  }
  let newScreen = delta[1]?.insert ? delta[1].insert[0] : delta[0].insert[0]

  sendMessage("add_screen", { after, screenId, newScreen: newScreen.toJSON() })
}
