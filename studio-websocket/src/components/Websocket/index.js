import Debug from "debug"
import { Server as WsServer } from "socket.io"
import { env } from "process"

import Component from "../component.js"

import { unfocusField } from "./controllers/unfocusFieldController.js"
import CONVERSATION_FORMATS from "./consts/conversationFormats.js"
import updateConversationController from "./controllers/updateConversationController.js"
import updateUserRightsController from "./controllers/updateUserRightsController.js"
import jobTranscriptionController from "./controllers/jobTranscriptionController.js"
import keywordController from "./controllers/keywordController.js"

import Conversations from "./models/conversations.js"
import SubtitleHelper from "./models/subtitles.js"
import updateSubtitlesController from "./controllers/updateSubtitlesController.js"
import hightLightController from "./controllers/highLightController.js"
import addScreenController from "./controllers/addScreenController.js"
import { apiDeleteTagFromConversation } from "./request/index.js"

const info = Debug("Websocket:info")
const debug = Debug("Websocket:debug:websocket")
export default class Websocket extends Component {
  constructor(app) {
    super(app, "WebServer")
    this.id = this.constructor.name
    this.app = app
    this.clients = []

    info("Websocket component loaded")

    this.app.io = new WsServer(this.app.components["WebServer"].httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      path: env.WEBSERVER_WS_PATH,
    })

    this.app.io.on("connection", async (socket) => {
      try {
        debug("Socket CONNECTED")
        await this.initConversation(socket)

        socket.on("disconnect", () => {
          debug("Socket DISCONNECTED")
        })

        // Update user rights (share/members)
        socket.on("update_users_rights", async (data) => {
          debug("update_users_rights event received")
          updateUserRightsController.bind(socket)(data)
        })

        socket.on("conversation_update", async (data) => {
          debug("conversation_update event received")
          updateConversationController.bind(socket)(data)
        })

        socket.on("focus_field", (data) => {
          debug("focus_field event received")
          let conversation = Conversations.getById(data.conversationId)
          let callback = () => {
            socket.emit("user_focus_field", {
              users: conversation.getUsersList(),
              focusFields: conversation.getFocusFields(),
            })

            socket
              .to(`conversation/${data.conversationId}`)
              .emit("user_focus_field", {
                users: conversation.getUsersList(),
                focusFields: conversation.getFocusFields(),
              })
          }

          conversation.updateUsers(
            data.userId,
            data.field,
            data.userToken,
            callback,
          )

          callback()
        })

        socket.on("unfocus_field", (data) => {
          debug("unfocus_field event received")
          unfocusField(
            data.conversationId,
            data.userId,
            socket,
            data.userToken,
            true,
          )
        })

        socket.on("fetch_hightlight", (data) => {
          debug("fetch_keywords event received")
          hightLightController.bind(socket)(data, this.app.io)
        })

        socket.on("get_subtitles", async (data) => {
          debug(`getting subtitles: ${data.subtitleId}`)
          let subtitle = await SubtitleHelper.requestSubtitle(
            data.conversationId,
            data.subtitleId,
            data.userToken,
          )

          socket.join(`subtitle/${data.subtitleId}`)

          socket.emit("subtitles_loaded", {
            subtitles: subtitle.getObj(),
            ydoc: subtitle.encodeStateVector(),
          })
        })

        socket.on("generate_subtitles", async (data) => {
          try {
            let newVersion = await SubtitleHelper.generateSubtitle(
              data.conversationId,
              data.data,
              data.userToken,
            )
            socket.emit("new_version", newVersion)

            socket
              .to(`conversation/${data.conversationId}`)
              .emit("new_version", newVersion)
          } catch (error) {
            socket.emit("api_error", error)
          }
        })
        socket.on("copy_subtitles", async (data) => {
          try {
            let newVersion = await SubtitleHelper.copySubtitle(
              data.conversationId,
              data.subtitleId,
              data.data,
              data.userToken,
            )
            socket.emit("new_version", newVersion)

            socket
              .to(`conversation/${data.conversationId}`)
              .emit("new_version", newVersion)
          } catch (error) {
            socket.emit("api_error", error)
          }
        })
        socket.on("delete_subtitles", async (data) => {
          try {
            SubtitleHelper.deleteSubtitle(
              data.conversationId,
              data.subtitleIds,
              data.userToken,
            )
            socket.emit("version_deleted", data.subtitleIds)

            socket
              .to(`conversation/${data.conversationId}`)
              .emit("version_deleted", data.subtitleIds)
          } catch (error) {
            socket.emit("api_error", error)
          }
        })
        socket.on("screen_update", (data) => {
          debug("screen_update received")
          updateSubtitlesController.bind(socket)(data)
        })
        socket.on("add_screen", (data) => {
          addScreenController.bind(socket)(data, this.app.io)
        })
        socket.on("remove_tag_from_conversation", (data) => {
          debug("remove_tag_from_conversation received")
          const room = `conversation/${data.conversationId}`

          let res = apiDeleteTagFromConversation(
            data.conversationId,
            data.tagId,
            data.userToken,
          )
          if (res.status === "error") {
            this.app.io.to(room).emit("api_error", res.data)
          } else {
            this.app.io.to(room).emit("tag_removed_from_conversation", {
              conversationId: data.conversationId,
              tagId: data.tagId,
            })
          }
        })
      } catch (error) {
        info("Error in websocket connection")
        info(error)
        socket.emit("error")
      }
    })

    this.app.io.of("/").adapter.on("create-room", (room) => {
      debug(`room ${room} was created`)
    })

    this.app.io.of("/").adapter.on("join-room", (room, id) => {
      debug(`socket ${id} has joined room ${room}`)
    })

    this.app.io.of("/").adapter.on("leave-room", (room, id) => {
      if (room.indexOf("conversation") !== -1) {
        unfocusField(room.split("/")[1], this.clients[id], this.app.io, false)
      }
      debug(`>>> socket ${id} has left room ${room}`)
    })
  }

  async initConversation(socket) {
    const connectionData = socket.handshake.query
    const conversationId = connectionData.conversationId
    const userToken = connectionData.userToken
    const userId = connectionData.userId
    const conversationFormat = Number(connectionData.conversationFormat)

    let conversation = null

    conversation =
      (await Conversations.getConversationByIdAndRefreshCache(
        conversationId,
        userToken,
      )) || (await Conversations.requestConversation(conversationId, userToken))
    debug("Loading conversation", conversationId)
    const rights = await Conversations.getRights(conversationId, userToken)

    if (!rights) {
      socket.emit(
        "error",
        "You don't have the rights to access this conversation",
      )
      return
    }

    if (!conversation) return

    if (conversationFormat === CONVERSATION_FORMATS.transcription) {
      await conversation.loadText(userToken)
      await conversation.loadSpeakers(userToken)
    } else {
      await conversation.loadSubtitleVersions(userToken)
    }

    socket.emit("load_conversation", {
      conversation: conversation.getObj(),
      users: conversation.getUsersList(),
      focusFields: conversation.getFocusFields(),
      ydoc: conversation.encodeStateVector(),
    })

    conversation.addUser(userId)
    this.clients[socket.id] = userId

    socket.join(`conversation/${conversationId}`)

    jobTranscriptionController(
      conversation,
      conversationId,
      userToken,
      this.app.io,
    )
  }
}
