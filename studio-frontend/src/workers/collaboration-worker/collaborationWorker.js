import { io } from "socket.io-client"
import Debug from "debug"

import {
  updateConversationTitle,
  updateConversationDescription,
  updateConversationSpeakerName,
  updateUsersRights,
  focusField,
  unfocusField,
  turnEditText,
  turnInsertParagraph,
  turnMergeParagraph,
  turnEditSpeaker,
  turnMergeSpeaker,
  updateConversationAddSpeaker,
  updateSubtitleScreenText,
  updateOrganizationRight,
  fetchSubtitles,
  generateSubtitles,
  copySubtitles,
  deleteSubtitles,
  updateSubtitleScreenTime,
  addScreen,
  mergeSubtitleScreens,
  deleteSubtitleScreen,
} from "./handlers/messageHandlers.js"

import { Conversation } from "./models/conversations.js"
import { Subtitle } from "./models/subtitles.js"
import {
  sendDocUpdateToWebsocketWrapper,
  sendNameUpdateToViewWrapper,
  sendDescriptionUpdateToViewWrapper,
  sendSpeakersUpdateToViewWrapper,
  sendTextUpdateToViewWrapper,
  sendOrgaUpdateToViewWrapper,
  sendScreenUpdateToViewWrapper,
} from "./handlers/docHandlers.js"

import { customDebug } from "../../tools/customDebug.js"
import SyllabicFR from "../../../public/js/syllabic/syllabicFR.js"
import SyllabicEN from "../../../public/js/syllabic/syllabicEN.js"

//let rootDoc = null
let conversation = null
let subtitle = null
let socket = null
let conversationId = ""
let subtitleId = ""
let userToken = ""
let userId = ""
let shouldDisconnect = false
let syllabic = null
let conversationFormat = null

const infoWorker = customDebug("Worker:info")
const debugWorker = customDebug("Worker:debug")
const debugWorkerDestroy = customDebug("Worker:debug:destroy")

const debugFocusWorker = customDebug("Worker:debug:focus")
const debugRightWorker = customDebug("Worker:debug:right")
const debugJobsWorker = customDebug("Worker:debug:jobs")

Debug.enable(process.env.VUE_APP_DEBUG)

function connect(event) {
  disconnect()

  // get conversationID and userToken
  conversationId = event.data?.params?.conversationId
  userToken = event.data?.params?.userToken
  userId = event.data?.params?.userId
  conversationFormat = event.data?.params?.conversationFormat
  infoWorker("Worker connected")
  //TODO: syncronise our offline changes

  // Connect to socket server
  shouldDisconnect = false
  socket = io(process.env.VUE_APP_WEBSOCKET_SERVER, {
    query: { conversationId, userToken, userId, conversationFormat },
    path: process.env.VUE_APP_WEBSOCKET_PATH,
    transports: ["websocket"],
  })
  // Set socket listeners
  setSocketListeners(socket)
}

onmessage = (event) => {
  if (
    event.data.action !== "user_focus_field" &&
    event.data.action !== "focus_field" &&
    event.data.action !== "unfocus_field"
  ) {
    debugWorker("Worker received message: %s", event.data.action)
  }
  switch (event.data?.action) {
    case "connect":
      connect(event)
      break
    case "disconnect":
      disconnect(event)
      break
    case "turn_edit_text":
      turnEditText(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
        syllabic,
      )
      break
    case "turn_insert_paragraph":
      turnInsertParagraph(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
        syllabic,
      )
      break
    case "turn_merge_paragraph":
      turnMergeParagraph(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
        syllabic,
      )
      break
    case "turn_edit_speaker":
      turnEditSpeaker(event.data.params, conversationId, conversation.getYdoc())
      break
    case "turn_merge_speaker":
      turnMergeSpeaker(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
      )
      break
    case "update_conversation_title":
      updateConversationTitle(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
      )
      break
    case "update_conversation_description":
      updateConversationDescription(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
      )
      break
    case "update_conversation_speaker_name":
      updateConversationSpeakerName(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
      )
      break
    case "update_conversation_add_speaker":
      updateConversationAddSpeaker(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
      )
      break
    case "update_conversation_users":
      updateUsersRights(event, socket, userToken)
      break
    case "update_organization_right":
      updateOrganizationRight(
        event.data.params,
        conversationId,
        conversation.getYdoc(),
      )
      break
    case "focus_field":
      focusField(event, conversationId, socket, userToken)
      break
    case "unfocus_field":
      unfocusField(event, conversationId, socket, userToken)
      break
    case "get_subtitle":
      fetchSubtitles(
        userToken,
        conversationId,
        event.data.params.subtitleId,
        socket,
      )
      break
    case "generate_subtitles":
      generateSubtitles(
        userToken,
        conversationId,
        event.data.params.data,
        socket,
      )
      break
    case "copy_subtitles":
      copySubtitles(
        userToken,
        conversationId,
        event.data.params.subtitleId,
        event.data.params.data,
        socket,
      )
      break
    case "delete_subtitles":
      deleteSubtitles(
        userToken,
        conversationId,
        event.data.params.subtitleIds,
        socket,
      )
      break
    case "update_screen":
      updateSubtitleScreenTime(event.data.params, subtitle.getYdoc())
      break
    case "delete_screen":
      deleteSubtitleScreen(event.data.params.screenId, subtitle.getYdoc())
      break
    case "screen_edit_text":
      updateSubtitleScreenText(event.data.params, subtitle.getYdoc())
      break
    case "fetch_hightlight":
      socket.emit("fetch_hightlight", {
        userToken,
        conversationId,
        serviceScope: event.data.params.serviceScope,
        categoryName: event.data.params.categoryName,
        categoryId: event.data.params.categoryId,
      })
      break
    case "merge_screens":
      mergeSubtitleScreens(event.data.params, subtitle.getYdoc())
      break
    case "remove_tag_from_conversation":
      socket.emit("remove_tag_from_conversation", {
        userToken,
        conversationId,
        tagId: event.data.params.tagId,
        conversationId: event.data.params.conversationId,
      })
      break
    case "add_screen":
      addScreen(
        userToken,
        conversationId,
        subtitleId,
        event.data.params,
        socket,
      )
      break
    default:
      break
  }
}

function disconnect() {
  shouldDisconnect = true
  debugWorkerDestroy("Start stopping worker...")
  if (socket) socket?.disconnect()
  debugWorkerDestroy("WS should be off")
  if (conversation !== null) {
    conversation.destroy()
    debugWorkerDestroy("Internal data has been clean")
  }
  conversation = null
  conversationId = ""
  subtitleId = ""
  userToken = ""
  socket = null
  infoWorker("Worker stopped")
  sendMessage({
    action: "disconnected",
  })
}

function setSocketListeners(socket) {
  socket.on("load_conversation", (data) => {
    try {
      if (conversation) {
        conversation.destroy()
      }
      conversation = new Conversation()
      conversation.applyBinaryDelta(data.ydoc, "websocket")
      conversation.setObj(data.conversation)
      syllabic = selectSyllabic(data.conversation.locale)

      infoWorker("conversation_loaded")

      debugWorker(
        "'%s', %s user(s) connected",
        data?.conversation?.name,
        data?.users?.length,
      )
      // Send conversation to front-end
      sendMessage("conversation_loaded", data.conversation)

      conversation
        .getYdoc()
        .on(
          "update",
          sendDocUpdateToWebsocketWrapper(socket, conversationId, userToken),
        )

      conversation
        .getYdoc()
        .getText("name")
        .observe(sendNameUpdateToViewWrapper(sendMessage, conversation))

      conversation
        .getYdoc()
        .getText("description")
        .observe(sendDescriptionUpdateToViewWrapper(sendMessage, conversation))

      conversation
        .getYdoc()
        .getArray("speakers")
        .observeDeep(sendSpeakersUpdateToViewWrapper(sendMessage, conversation))

      conversation
        .getYdoc()
        .getArray("text")
        .observeDeep(sendTextUpdateToViewWrapper(sendMessage, conversation))

      conversation
        .getYdoc()
        .getMap("organization")
        .observeDeep(sendOrgaUpdateToViewWrapper(sendMessage, conversation))

      // Set connected users
      let users = data.users
      let focusFields = data.focusFields
      if (users?.length > 0) {
        sendMessage("user_focus_field", { users, focusFields })
      }
    } catch (error) {
      console.error(error)
    }
  })

  socket.on("success", (data) => {
    console.log("server success !")
  })

  socket.on(`conversation_updated`, (data) => {
    debugWorker("Websocket event 'conversation_updated'")
    conversation.applyBinaryDelta(data.delta, "websocket")
  })

  socket.on(`update_users_rights`, (data) => {
    debugRightWorker("Websocket event 'update_users_rights'")
    sendMessage("update_users_rights", { data })
  })

  socket.on(`user_focus_field`, (data) => {
    //debugFocusWorker("Websocket event 'user_focus_field'")
    sendMessage("user_focus_field", data)
  })

  socket.on("user_right_updated", (data) => {
    debugRightWorker("Websocket event 'user_right_updated'")
    sendMessage("user_right_updated", data)
  })

  socket.on("job_transcription_update", (data) => {
    debugJobsWorker("Websocket event 'job_transcription_update'")
    sendMessage("job_transcription_update", data)
  })

  socket.on("keywords_update", (data) => {
    debugJobsWorker("Websocket event 'keywords_update'")
    sendMessage("keywords_update", data)
  })

  socket.on("hightlight_update", (data) => {
    debugJobsWorker("Websocket event 'hightlight_update'")
    sendMessage("hightlight_update", data)
  })

  socket.on("tag_removed_from_conversation", (data) => {
    debugJobsWorker("Websocket event 'tag_removed_from_conversation'")
    sendMessage("tag_removed_from_conversation", data)
  })

  socket.on("subtitles_loaded", (data) => {
    debugJobsWorker("Websocket event 'subtitles_loaded'")
    try {
      if (subtitle) {
        subtitle.destroy()
      }
      subtitle = new Subtitle()
      subtitle.applyBinaryDelta(data.ydoc)
      subtitle.setObj(data.subtitles)
      subtitleId = subtitle.getObj()._id
      sendMessage("subtitles_loaded", data)

      subtitle
        .getYdoc()
        .on(
          "update",
          sendDocUpdateToWebsocketWrapper(socket, subtitleId, userToken),
        )
      subtitle
        .getYdoc()
        .getArray("screens")
        .observeDeep(sendScreenUpdateToViewWrapper(sendMessage, subtitle))
    } catch (error) {
      console.log(error)
    }
  })

  socket.on("subtitle_updated", (data) => {
    debugJobsWorker("Websocket event 'subtitle_updated'")
    subtitle.applyBinaryDelta(data.delta, "websocket")
  })

  socket.on("new_version", (data) => {
    debugJobsWorker("Websocket event 'new_version'")
    sendMessage("new_version", data)
  })

  socket.on("version_deleted", (data) => {
    debugJobsWorker("Websocket event 'version_deleted'")
    sendMessage("version_deleted", data)
  })

  socket.on(`api_error`, (data) => {
    debugWorker("Websocket event 'api_error'")
    sendMessage("api_error", data)
  })

  socket.on(`error`, (data) => {
    debugWorker("Websocket event 'error'")
    sendMessage("error", data)
  })

  socket.on("disconnect", () => {
    infoWorker("Websocket disconnected")
    if (!shouldDisconnect) {
      sendMessage("disconnected")
    }
  })
}

function sendMessage(action, params) {
  postMessage({
    action,
    params,
  })
}

function selectSyllabic(lang) {
  switch (lang) {
    case "fr-FR":
      return new SyllabicFR()
    case "en-US":
    case "en-GB":
      return new SyllabicEN()
    default:
      return new SyllabicFR()
  }
}
