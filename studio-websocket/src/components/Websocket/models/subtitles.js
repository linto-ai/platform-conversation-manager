import * as Y from "yjs"
import {
  copySubtitlesBySubtitleId,
  deleteSubtitlesByIds,
  generateSubtitlesByConversationId,
  apiGetRights,
  getSubtitleById,
  getSubtitleListByConversationId,
} from "../request/index.js"
import Debug from "debug"
import { Job } from "./job.js"
import Conversations from "./conversations.js"
import { handleScreenChange } from "./conversations/screenHandler.js"
import { v4 as uuidv4 } from "uuid"
import findScreenIndex from "../tools/findScreenIndex.js"

const debug = Debug("Websocket:debug:models:subtitles")

export default class SubtitleHelper {
  static subtitleCache = {}

  static getById(subtitleId) {
    return this.subtitleCache[subtitleId] || null
  }

  static async requestSubtitlesList(conversationId, userToken) {
    debug("Request subtitles list", conversationId)
    let getSubtitleList = await getSubtitleListByConversationId(
      conversationId,
      userToken,
    )
    if (getSubtitleList.status === "success") {
      return getSubtitleList.data
    } else {
      return null
    }
  }

  static async requestSubtitle(conversationId, subtitleId, userToken) {
    debug("Request subtitle", subtitleId)
    if (this.subtitleCache[subtitleId]) {
      return this.subtitleCache[subtitleId]
    }
    let getSubtitle = await getSubtitleById(
      conversationId,
      subtitleId,
      userToken,
    )
    if (getSubtitle.status === "success") {
      return this.add(getSubtitle.data, subtitleId)
    }
  }

  static async getSubtitleFromCache(subtitleId) {
    return this.subtitleCache[subtitleId] || null
  }

  static async getRights(conversationId, userToken) {
    let rights = await apiGetRights(conversationId, userToken)
    if (rights.status == "success") {
      return rights
    } else {
      return false
    }
  }
  static async generateSubtitle(conversationId, data, userToken) {
    let generated = await generateSubtitlesByConversationId(
      conversationId,
      data,
      userToken,
    )
    if (generated.status === "success") {
      let newVersion = {
        _id: generated.data._id,
        conv_id: conversationId,
        version: generated.data.version,
        generate_settings: {
          screenCharSize: data.screenCharSize,
          screenLines: data.screenLines,
        },
      }
      Conversations.getById(conversationId).pushVersion(newVersion)
      this.add(generated.data, newVersion._id)
      return newVersion
    } else {
      throw generated.data.response.data.message
    }
  }

  static async copySubtitle(conversationId, subtitleId, data, userToken) {
    let generated = await copySubtitlesBySubtitleId(
      conversationId,
      subtitleId,
      data,
      userToken,
    )
    if (generated.status === "success") {
      let subtitle = await this.requestSubtitle(
        conversationId,
        generated.data._id,
        userToken,
      )
      let newVersion = {
        _id: generated.data._id,
        conv_id: conversationId,
        version: data.version,
        generate_settings: subtitle.obj.generate_settings,
      }
      Conversations.getById(conversationId).pushVersion(newVersion)
      return newVersion
    } else {
      throw generated.data.response.data.message
    }
  }

  static async deleteSubtitle(conversationId, subtitleIds, userToken) {
    let deleted = await deleteSubtitlesByIds(
      conversationId,
      subtitleIds,
      userToken,
    )

    if (deleted.status === "success") {
      for (const subtitleId of subtitleIds) {
        Conversations.getById(conversationId).deleteVersion(subtitleId)
        this.delete(subtitleId)
      }
    } else {
      throw deleted.data.response.data.message
    }
  }

  static add(subtitleObj, subtitleId) {
    let sub = this.subtitleCache[subtitleId]
    if (sub) {
      sub.destroy()
    }

    this.subtitleCache[subtitleId] = new Subtitle(subtitleObj)

    return this.subtitleCache[subtitleId]
  }

  static delete(subtitleId) {
    let sub = this.subtitleCache[subtitleId]
    if (sub) {
      sub.destroy()
    }
  }
}

export class Subtitle {
  constructor(subtitleObj) {
    this.ydoc = new Y.Doc()
    this.users = []
    this.undoManagers = new Map()
    this.obj = subtitleObj ? subtitleObj : {}
    this.transactionInfos = new Map()

    this.watchProperties = [this.ydoc.getArray("screens")]

    this.observeChange()

    if (subtitleObj) {
      this.initYjsFromObj(subtitleObj)
      this.transcriptionJob = new Job("transcription", this.id, subtitleObj)
    } else {
      this.transcriptionJob = new Job("transcription", this.id)
    }
  }

  observeChange() {
    this.getYdoc().on("update", (binaryDelta, origin) => {
      if (origin === "websocket" || origin === "undo") return

      let transactInfo = this.transactionInfos.get(origin)
      if (transactInfo.needDelta) {
        this.updateObj("screens", this.getScreens())
        transactInfo.callback(binaryDelta)
      }
    })

    this.getYdoc()
      .getArray("screens")
      .observeDeep(async (yTextEvent, transaction) => {
        if (transaction.origin === "websocket" || transaction.origin === "undo")
          return

        let transactInfo = this.transactionInfos.get(transaction.origin)
        if (transactInfo.needDelta) return

        const status = transactInfo.userToken
          ? await handleScreenChange(
              yTextEvent,
              transaction,
              this.getObj().conv_id,
              this.getObj()._id,
              transactInfo.userToken,
            )
          : true

        if (status) {
          this.updateObj("screens", this.getScreens())
          transactInfo.callback(status)
        } else {
          this.undo(transaction.origin)
          transactInfo.callback(status)
        }
      })
  }

  updateObj(key, value) {
    this.obj[key] = value
  }

  initYjsFromObj(subtitleObj) {
    this.ydoc.transact(() => {
      this.initScreens(subtitleObj.screens)
    }, "websocket")
  }

  initScreens(screens) {
    for (const screen of screens) {
      this.ydoc.getArray("screens").push([Subtitle.formatScreen(screen)])
    }
  }

  addScreen(screenData, callback) {
    let transactionName = uuidv4()

    this.transactionInfos.set(transactionName, { callback, needDelta: true })

    try {
      let { after, screen_id, newScreen } = screenData

      // add 1 to the index if screen created after
      let index = findScreenIndex(this.getScreens(), screen_id) + after
      this.ydoc.transact(() => {
        this.ydoc
          .getArray("screens")
          .insert(index, [Subtitle.formatScreen(newScreen)])
      }, transactionName)
    } catch (error) {
      console.log(error)
    }
  }

  applyBinaryDelta(
    binaryDelta,
    transactionName,
    undo = false,
    callback,
    userToken,
  ) {
    if (undo) {
      this.createUndoManager(transactionName)
    }

    this.transactionInfos.set(transactionName, { callback, userToken })

    try {
      this.ydoc.transact(() => {
        Y.applyUpdate(this.ydoc, new Uint8Array(binaryDelta))
      }, transactionName)
    } catch (error) {
      console.log(error)
    }
  }

  createUndoManager(transactionName) {
    if (!this.undoManagers.get(transactionName)) {
      this.undoManagers.set(
        transactionName,
        new Y.UndoManager(this.watchProperties, {
          trackedOrigins: new Set([transactionName]),
        }),
      )
    }

    return this.undoManagers.get(transactionName)
  }

  undo(transactionName) {
    this.ydoc.transact(() => {
      this.undoManagers.get(transactionName).undo()
    }, "undo")
  }

  deleteUndoManager(transactionName) {
    const undoManager = this.undoManagers.get(transactionName)
    if (undoManager) {
      undoManager.stopCapturing()
      undoManager.clear()
      this.undoManagers.delete(transactionName)
    }
  }

  getObj() {
    return this.obj
  }

  getYdoc() {
    return this.ydoc
  }

  getScreens() {
    return this.ydoc.getArray("screens").toJSON()
  }

  encodeStateVector() {
    return Y.encodeStateAsUpdate(this.ydoc)
  }

  destroy() {
    this.ydoc.destroy()
  }

  static formatScreen(screen) {
    const ywords = Y.Array.from(screen.words)
    const ytext = Y.Array.from(screen.text)
    const yscreen = new Y.Map(Object.entries(screen))
    yscreen.set("words", ywords)
    yscreen.set("text", ytext)
    return yscreen
  }

  static mergeUpdates(deltas) {
    return Y.mergeUpdates(deltas)
  }
}
