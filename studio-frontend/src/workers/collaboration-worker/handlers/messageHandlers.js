import DiffMatchPatch from "diff-match-patch"
import myersDiff from "myers-diff"
import Debug from "debug"

import { diffsToYDelta } from "../../../tools/diffsToYDelta"
import { wordsDeltafromPlainDiff } from "../../../tools/wordsDeltaFromPlainDiffV2"
import { applyDeltaOnYArray } from "../../../tools/applyDeltaOnYArray"
import { divideTurn } from "../../../tools/divideTurn"
import { Conversation } from "../models/conversations"
import { mergeTurn } from "../../../tools/mergeTurn"
import { customDebug } from "../../../tools/customDebug"
import { diffArrays } from "diff"

const dmp = new DiffMatchPatch()
const debugWorker = customDebug("Worker:debug")
const debugturnEditText = customDebug("Worker:debug:turn:EditText")
const debugturnInsertParagraph = customDebug(
  "Worker:debug:turn:InsertParagraph"
)
const debugturnMergeParagraph = customDebug("Worker:debug:turn:MergeParagraph")
const debugAddSpeaker = customDebug("Worker:debug:Speaker:AddSpeaker")
const debugEditSpeaker = customDebug("Worker:debug:Speaker:EditSpeaker")
const debugEditRight = customDebug("Worker:debug:right")
const debugEditScreen = customDebug("Worker:debug:screen:EditScreen")

function getYdelta(ydocElem, newValue) {
  let diff = dmp.diff_main(ydocElem, newValue)
  return diffsToYDelta(diff)
}

function findTurnIndex(turns, turnId) {
  return turns.findIndex((turn) => turn.turn_id === turnId)
}

function findScreenIndex(screens, screenId) {
  return screens.findIndex((screen) => screen.screen_id === screenId)
}

// When updating/adding a speaker, check if the updated speaker still have turns
function cleanSpeakers(rootDoc, currentSpeakerId) {
  const turns = rootDoc.getArray("text").toJSON()
  const prevSpkTurns = turns.find(
    (turn) => turn.speaker_id === currentSpeakerId
  )
  if (prevSpkTurns == undefined) {
    const delIndex = rootDoc
      .getArray("speakers")
      .toJSON()
      .findIndex((spk) => spk.speaker_id === currentSpeakerId)
    rootDoc.getArray("speakers").delete(delIndex, 1)
  }
}

export function updateConversationTitle(params, conversationId, rootDoc) {
  const { conversationName } = params
  const yDelta = getYdelta(rootDoc.getText("name").toString(), conversationName)

  rootDoc.transact(() => {
    rootDoc.getText("name").applyDelta(yDelta)
  }, "conversation_name")
}

export function updateConversationDescription(params, conversationId, rootDoc) {
  const { conversationDescription } = params
  const yDelta = getYdelta(
    rootDoc.getText("description").toString(),
    conversationDescription
  )

  rootDoc.transact(() => {
    rootDoc.getText("description").applyDelta(yDelta)
  }, "conversation_description")
}

export function updateConversationSpeakerName(params, conversationId, rootDoc) {
  const { newSpeakerName, speakerId } = params
  let spkIndex = rootDoc
    .getArray("speakers")
    .toJSON()
    .findIndex((spk) => spk.speaker_id === speakerId)

  const yDelta = getYdelta(
    rootDoc.getArray("speakers").get(spkIndex).get("speaker_name").toString(),
    newSpeakerName
  )

  rootDoc.transact(() => {
    rootDoc
      .getArray("speakers")
      .get(spkIndex)
      .get("speaker_name")
      .applyDelta(yDelta)
    debugEditSpeaker(
      "Update speaker_name '%s' on speaker %s",
      newSpeakerName,
      spkIndex
    )
  }, "conversation_speaker_name")
}

export function turnEditText(params, conversationId, rootDoc, syllabic) {
  const { turnId, newText, oldText, words } = params

  if (oldText.trim() == newText.trim()) {
    return
  }
  debugturnEditText("oldText (trimed) >%s<", oldText.trim(), words)
  debugturnEditText("newText (trimed) >%s<", newText.trim())

  const splitText = newText.split(" ").map((word) => ({ word: word.trim() }))
  const diff = diffArrays(
    words.filter((w) => w.word !== ""),
    splitText,
    {
      comparator: (a, b) => a.word === b.word,
    }
  )

  const wordObjDelta = wordsDeltafromPlainDiff(splitText, words, diff, syllabic)

  const index = findTurnIndex(rootDoc.getArray("text").toJSON(), turnId)

  debugturnEditText("wordObjDelta %o", wordObjDelta)

  rootDoc.transact(() => {
    applyDeltaOnYArray(
      rootDoc.getArray("text").get(index).get("words"),
      wordObjDelta
    )
    debugturnEditText("WordObjDelta applied")

    const wordsObj = rootDoc.getArray("text").get(index).get("words").toJSON()
    let newSeg = ""
    for (let word of wordsObj) {
      if (word.word !== " " && word.word !== "") newSeg += word.word + " "
    }
    const deltaSegment = getYdelta(
      rootDoc.getArray("text").get(index).get("segment").toString(),
      newSeg.trim()
    )
    debugturnEditText("deltaSegment %o", deltaSegment)

    rootDoc.getArray("text").get(index).get("segment").applyDelta(deltaSegment)
    debugturnEditText("DeltaSegment applied")
  }, "conversation_text")
}

export function turnInsertParagraph(params, conversationId, rootDoc, syllabic) {
  const { turnId, textBefore, textAfter, turn } = params

  const index = findTurnIndex(rootDoc.getArray("text").toJSON(), turnId)
  debugturnInsertParagraph("textBefore >%s<", textBefore.trim())
  debugturnInsertParagraph("textAfter >%s<", textAfter.trim())
  debugturnInsertParagraph("turn to cut %o", turn)
  const newTurns = divideTurn(
    turn,
    textBefore.trim(),
    textAfter.trim(),
    syllabic
  )
  debugturnInsertParagraph("newTurns %o at index %s", newTurns, index)

  const newYturns = newTurns.map((turn) => Conversation.formatYturn(turn))
  const delta = [{ retain: index }, { delete: 1 }, { insert: newYturns }]

  rootDoc.transact(() => {
    applyDeltaOnYArray(rootDoc.getArray("text"), delta)
    debugturnInsertParagraph("Applied delta")
  }, "conversation_insert_paragraph")
}

export function turnMergeParagraph(params, conversationId, rootDoc, syllabic) {
  const { startTurn, endTurn, indexEnd } = params

  debugturnMergeParagraph("startTurn %o", startTurn)
  debugturnMergeParagraph("endTurn %o", endTurn)

  const mergedTurn = mergeTurn(startTurn, endTurn, syllabic)
  debugturnMergeParagraph("mergedTurn %o", mergedTurn)

  const delta = [
    { retain: indexEnd - 1 },
    { delete: 2 },
    { insert: [Conversation.formatYturn(mergedTurn)] },
  ]

  rootDoc.transact(() => {
    applyDeltaOnYArray(rootDoc.getArray("text"), delta)
    debugturnMergeParagraph("Applied delta")
  }, "conversation_merge_paragraph")
}

export function turnEditSpeaker(params, conversationId, rootDoc) {
  const { turnId, newSpeakerId } = params

  rootDoc.transact(() => {
    const turnIndex = findTurnIndex(rootDoc.getArray("text").toJSON(), turnId)
    debugEditSpeaker("Update speaker_id %s on turn %s", newSpeakerId, turnIndex)
    debugEditSpeaker("Text %o", rootDoc.getArray("text").get(turnIndex))

    // Get current speaker Id
    const currentSpeakerId = rootDoc
      .getArray("text")
      .get(turnIndex)
      .get("speaker_id")

    rootDoc.getArray("text").get(turnIndex).set("speaker_id", newSpeakerId)

    // Check if updated speakers still have turns
    cleanSpeakers(rootDoc, currentSpeakerId)
  }, "conversation_edit_speaker")
}

export function turnMergeSpeaker(params, conversationId, rootDoc) {
  const { currentSpeakerId, newSpeakerId } = params

  rootDoc.transact(() => {
    // find all turn with currentSpeakerId and update speaker_id to newSpeakerId
    const turns = rootDoc.getArray("text").toJSON()
    const turnIndexes = turns.map((turn, index) =>
      turn.speaker_id === currentSpeakerId ? index : -1
    )

    turnIndexes.forEach((index) => {
      if (index !== -1) {
        rootDoc.getArray("text").get(index).set("speaker_id", newSpeakerId)
        debugEditSpeaker("Update speaker_id %s on turn %s", newSpeakerId, index)
      }
    })

    // Check if updated speakers still have turns
    cleanSpeakers(rootDoc, currentSpeakerId)
  }, "conversation_edit_speaker")
}

export function updateSubtitleScreenText({ screenId, newText }, rootDoc) {
  debugEditScreen(`update screen ${screenId} with new text: %s`, newText)
  rootDoc.transact(() => {
    const screenIndex = findScreenIndex(
      rootDoc.getArray("screens").toJSON(),
      screenId
    )
    let screen = rootDoc.getArray("screens").get(screenIndex)
    const newlines = newText.toString().split("\n")
    for (let i = 0; i < newlines.length; i++) {
      switch (screen.get("text").get(i)) {
        case newlines[i]:
          continue
          break
        case undefined:
          screen.get("text").insert(i, [newlines[i]])
          break
        default:
          screen.get("text").delete(i, 1)
          screen.get("text").insert(i, [newlines[i]])
          break
      }
    }
  }, "subtitle_edit_screen_text")
}

export function updateSubtitleScreenTime(params, rootDoc) {
  const { screen } = params
  const screenIndex = findScreenIndex(
    rootDoc.getArray("screens").toJSON(),
    screen.screen_id
  )

  rootDoc.transact(() => {
    debugEditScreen(
      `update screen ${screen.screen_id} with new timestamp: ${screen.stime} - ${screen.etime}`
    )
    rootDoc.getArray("screens").get(screenIndex).set("stime", screen.stime)
    rootDoc.getArray("screens").get(screenIndex).set("etime", screen.etime)
  }, "subtitle_edit_screen_timestamp")
}

export function deleteSubtitleScreen(screenId, rootDoc) {
  const screenIndex = findScreenIndex(
    rootDoc.getArray("screens").toJSON(),
    screenId
  )
  console.log("screenIndex", screenIndex)
  rootDoc.transact(() => {
    debugEditScreen(`delete screen ${screenId}`)
    rootDoc.getArray("screens").delete(screenIndex, 1)
  }, "subtitle_delete_screen")
}

export function mergeSubtitleScreens(params, rootDoc) {
  const { keptScreenId, deletedScreenId } = params
  let screens = rootDoc.getArray("screens")
  const keptScreenIndex = findScreenIndex(screens.toJSON(), keptScreenId)
  const deletedScreenIndex = findScreenIndex(screens.toJSON(), deletedScreenId)

  let keptScreen = screens.get(keptScreenIndex)
  let deletedScreen = screens.get(deletedScreenIndex)

  rootDoc.transact(() => {
    debugEditScreen(`merge screen ${deletedScreenId} into ${keptScreenId}`)

    if (deletedScreenIndex > keptScreenIndex) {
      keptScreen.get("text").push(deletedScreen.get("text"))
      keptScreen.get("words").push(deletedScreen.get("words"))

      keptScreen.set("etime", deletedScreen.get("etime"))
    } else {
      keptScreen.get("text").insert(0, deletedScreen.get("text"))
      keptScreen.get("words").insert(0, deletedScreen.get("words"))

      keptScreen.set("stime", deletedScreen.get("stime"))
    }

    screens.delete(deletedScreenIndex, 1)
  }, "subtitle_merge_screens")
}

export function updateConversationAddSpeaker(params, conversationId, rootDoc) {
  const { turnId, speakerName } = params
  let yspeaker = Conversation.createSpeaker(speakerName)
  debugAddSpeaker("Add speaker '%s'", speakerName)
  const turnIndex = findTurnIndex(rootDoc.getArray("text").toJSON(), turnId)

  rootDoc.transact(() => {
    rootDoc.getArray("speakers").push([yspeaker])
    debugAddSpeaker("Push speaker")

    // Get current speaker Id
    const currentSpeakerId = rootDoc
      .getArray("text")
      .get(turnIndex)
      .get("speaker_id")

    rootDoc
      .getArray("text")
      .get(turnIndex)
      .set("speaker_id", yspeaker.get("speaker_id"))

    debugAddSpeaker(
      "Update speaker_id %s on turn %s",
      yspeaker?.get("speaker_id"),
      turnIndex
    )

    // Check if updated speakers still have turns
    cleanSpeakers(rootDoc, currentSpeakerId)
  }, "conversation_add_speaker")
}

export function updateUsersRights(event, socket, userToken) {
  let payload = {
    conversationId: event.data.params.conversationId,
    userId: event.data.params.userId,
    right: event.data.params.right,
    userToken,
  }
  debugEditRight("%s", payload)
  socket.emit("update_users_rights", payload)
}

export function updateOrganizationRight(params, conversationId, rootDoc) {
  debugEditRight("membersRight: %s", params)
  rootDoc.transact(() => {
    rootDoc.getMap("organization").set("membersRight", params)
  }, "conversation_update_organization")
}

export function focusField(event, conversationId, socket, userToken) {
  if (event.data.params?.field && event.data.params?.userId) {
    socket.emit("focus_field", {
      ...event.data.params,
      conversationId,
      userToken,
    })
  }
}

export function unfocusField(event, conversationId, socket, userToken) {
  socket.emit("unfocus_field", {
    ...event.data.params,
    conversationId,
    userToken,
  })
}

export function fetchSubtitles(userToken, conversationId, subtitleId, socket) {
  socket.emit("get_subtitles", { userToken, conversationId, subtitleId })
}

export function generateSubtitles(userToken, conversationId, data, socket) {
  socket.emit("generate_subtitles", { userToken, conversationId, data })
}

export function copySubtitles(
  userToken,
  conversationId,
  subtitleId,
  data,
  socket
) {
  socket.emit("copy_subtitles", { userToken, conversationId, subtitleId, data })
}

export function deleteSubtitles(
  userToken,
  conversationId,
  subtitleIds,
  socket
) {
  socket.emit("delete_subtitles", { userToken, conversationId, subtitleIds })
}

export function addScreen(userToken, conversationId, subtitleId, data, socket) {
  socket.emit("add_screen", {
    userToken,
    conversationId,
    subtitleId,
    screenData: data,
  })
}
