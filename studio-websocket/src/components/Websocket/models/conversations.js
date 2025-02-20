import * as Y from "yjs"
import {
  apiGetKeywords,
  getConversationById,
  getConversationNameAndDesc,
  apiGetConversationText,
  apiGetRights,
  getSubtitleListByConversationId,
  apiGetConversationSpeakers,
} from "../request/index.js"
import { v4 as uuidv4 } from "uuid"
import Debug from "debug"
import { Job, jobTrapper } from "./job.js"

import { handleTextChange } from "./conversations/textHandler.js"
import { handleSpeakerChange } from "./conversations/speakerHandler.js"

const debug = Debug("Websocket:debug:models:conversations")
export default class Conversations {
  static conversations = {}

  static getById(conversationId) {
    let conv = this.conversations[conversationId]

    if (conv) {
      return conv
    } else {
      return null
    }
  }

  static async getConversationByIdAndRefreshCache(conversationId, userToken) {
    debug("get conversation", conversationId, "from cache")
    let conv = this.conversations[conversationId]

    if (!conv) {
      return null
    }

    const newData = await getConversationNameAndDesc(conversationId, userToken)

    if (newData.status == "success") {
      conv.updateObj("name", newData.data.name)
      conv.updateObj("description", newData.data.description)
      return conv
    }

    debug.error("Error while refreshing conversation cache", newData)
    return null
  }

  static async requestConversation(conversationId, userToken) {
    debug("Request conversation", conversationId)
    let getConversation = await getConversationById(conversationId, userToken)
    if (getConversation.status == "success") {
      const conversation = this.add(getConversation.data, conversationId)
      debug("Request keywords", conversationId)
      const keywords = await apiGetKeywords(
        conversationId,
        conversation.getOrganizationId(),
        userToken,
      )

      //const keywords = []

      if (keywords?.status == "error") {
        conversation.setKeywords([])
      } else {
        debug("Set keywords", keywords, conversationId)
        conversation.setKeywords(keywords)
      }
      return conversation
    } else {
      return null
    }
  }

  static add(conversationObj, conversationId) {
    let conv = this.conversations[conversationId]
    if (conv) {
      conv.destroy()
    }

    this.conversations[conversationId] = new Conversation(conversationObj)

    return this.conversations[conversationId]
  }

  static async getRights(conversationId, userToken) {
    let rights = await apiGetRights(conversationId, userToken)
    if (rights.status == "success") {
      return rights
    } else {
      return false
    }
  }
}

export class Conversation {
  constructor(conversationObj) {
    this.ydoc = new Y.Doc()
    this.obj = conversationObj ? conversationObj : {}
    this.users = []
    this.undoManagers = new Map()
    this.callbacks = new Map()
    this.userTokenIndexedByTransactionName = new Map()
    this.id = conversationObj ? conversationObj._id : uuidv4()

    this.jobs = new Proxy(this, jobTrapper)

    this.watchProperties = [
      this.ydoc.getArray("speakers"),
      this.ydoc.getArray("text"),
      this.ydoc.getMap("organization"),
    ]

    this.observeChange()

    if (conversationObj) {
      this.initYjsFromObj(conversationObj)
      this.transcriptionJob = new Job("transcription", this.id, conversationObj)
    } else {
      this.transcriptionJob = new Job("transcription", this.id)
    }
  }

  observeChange() {
    this.getYdoc()
      .getArray("speakers")
      .observeDeep(async (yTextEvent, transaction) => {
        if (transaction.origin == "websocket" || transaction.origin == "undo")
          return

        let status = await handleSpeakerChange(
          yTextEvent,
          transaction,
          this.id,
          this.userTokenIndexedByTransactionName.get(transaction.origin),
        )

        if (status) {
          this.updateObj("speakers", this.getSpeakers())
          this.callbacks.get(transaction.origin)(status)
        } else {
          this.undo(transaction.origin)
          this.callbacks.get(transaction.origin)(status)
        }
      })

    this.getYdoc()
      .getArray("text")
      .observeDeep(async (yTextEvent, transaction) => {
        if (transaction.origin == "websocket" || transaction.origin == "undo")
          return

        let status = await handleTextChange(
          yTextEvent,
          transaction,
          this.id,
          this.userTokenIndexedByTransactionName.get(transaction.origin),
        )

        if (status) {
          this.updateObj("text", this.getConversationText())
          this.callbacks.get(transaction.origin)(status)
        } else {
          this.undo(transaction.origin)
          this.callbacks.get(transaction.origin)(status)
        }
      })

    this.getYdoc()
      .getMap("organization")
      .observeDeep(() => {
        this.updateObj("organization", this.getConversationOrga())
      })

    this.getYdoc()
      .getArray("subtitleVersions")
      .observeDeep((ytextEvent, transaction) => {
        if (transaction.origin != "websocket") {
          this.updateObj(
            "subtitleVersions",
            ytextEvent[0].currentTarget.toJSON(),
          )
        }
      })
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

    this.userTokenIndexedByTransactionName.set(transactionName, userToken)
    this.callbacks.set(transactionName, callback)

    try {
      this.ydoc.transact(() => {
        Y.applyUpdate(this.ydoc, new Uint8Array(binaryDelta))
      }, transactionName)
    } catch (error) {
      console.error(error)
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

  encodeStateVector() {
    return Y.encodeStateAsUpdate(this.ydoc)
  }

  updateObj(key, value) {
    // TODO: check if old value is sync with api
    this.obj[key] = value
  }

  getObj() {
    return this.obj
  }

  setObj(obj) {
    this.obj = obj
  }

  getYdoc() {
    return this.ydoc
  }

  getConversationName() {
    return this.ydoc.getText("name").toString()
  }

  getConversationDescription() {
    return this.ydoc.getText("description").toString()
  }

  getConversationText() {
    return this.ydoc.getArray("text").toJSON()
  }

  getSpeakers() {
    return this.ydoc.getArray("speakers").toJSON()
  }

  getConversationOrga() {
    return this.ydoc.getMap("organization").toJSON()
  }

  getOrganizationId() {
    return this.obj.organization.organizationId
  }

  getKeywordsJob() {
    return this.obj?.jobs?.keyword
  }

  setKeywordsJob(job) {
    if (!this.obj.jobs) this.obj.jobs = {}
    if (!this.obj.jobs.keyword) this.obj.jobs.keyword = {}
    this.obj.jobs.keyword = job
  }

  getKeywords() {
    return this.obj.keywords
  }

  setKeywords(keywords) {
    this.obj.keywords = keywords
  }

  setJobs(key, job) {
    if (!this.obj.jobs) this.obj.jobs = {}

    this.obj.jobs[key] = job
  }

  initYjsFromObj(conversationObj) {
    this.ydoc.transact(() => {
      this.initSpeakers(conversationObj.speakers)
      this.initOrganization(conversationObj.organization)
    }, "websocket")
  }

  async loadText(userToken) {
    if (this.ydoc.getArray("text").length === 0) {
      let text = await apiGetConversationText(this.id, userToken)
      this.initText(text.data.text)
    }
  }

  async loadSpeakers(userToken) {
    if (this.ydoc.getArray("speakers").length === 0) {
      let speakers = await apiGetConversationSpeakers(this.id, userToken)
      this.initSpeakers(speakers.data.speakers)
    }
  }

  async loadSubtitleVersions(userToken) {
    if (this.ydoc.getArray("subtitleVersions").length === 0) {
      let versions = await getSubtitleListByConversationId(this.id, userToken)
      this.initSubtitleVersions(versions)
    }
  }

  initText(text) {
    if (!text) return
    this.obj["text"] = text
    this.ydoc.transact(() => {
      for (const turn of text) {
        this.ydoc.getArray("text").push([Conversation.formatYturn(turn)])
      }
    }, "websocket")
  }

  initSubtitleVersions(versions) {
    // NOTE: may need to be expanded
    if (!versions) return
    this.obj["subtitleVersions"] = versions
    this.ydoc.transact(() => {
      this.ydoc.getArray("subtitleVersions").push(versions)
    }, "websocket")
  }

  pushVersion(newVersion) {
    this.ydoc.getArray("subtitleVersions").push([newVersion])
  }

  deleteVersion(versionId) {
    let deleteIndex = this.ydoc
      .getArray("subtitleVersions")
      .toArray()
      .findIndex((version) => version._id === versionId)
    if (deleteIndex !== -1) {
      this.ydoc.getArray("subtitleVersions").delete(deleteIndex)
    }
  }

  initSpeakers(speakers) {
    try {
      this.obj["speakers"] = speakers
      this.ydoc.transact(() => {
        for (let spk of speakers) {
          let ySpk = { ...spk, speaker_name: new Y.Text() }
          ySpk.speaker_name.insert(0, spk.speaker_name)
          let yspeaker = new Y.Map(Object.entries(ySpk))
          this.ydoc.getArray("speakers").push([yspeaker])
        }
      }, "websocket")
    } catch (error) {
      console.error(error)
    }
  }

  initOrganization(orga) {
    const yorga = this.ydoc.getMap("organization")
    yorga.set("organizationId", orga?.organizationId)
    yorga.set("membersRight", orga?.membersRight)
    yorga.set("customRights", orga?.customRights)
  }

  listUsers() {
    return this.users
  }

  getUserById(userId) {
    return this.users[userId]
  }

  addUser(userId) {
    this.users[userId] = new User(userId)
    return this.users[userId]
  }

  removeUser(userId) {
    this.users[userId] = null
  }

  destroy() {
    this.ydoc.destroy()
    delete this.obj
    this.obj = {}
  }

  updateUsers(userId, inputField, userToken, callbackWhenTimeout) {
    this.users[userId].addFocusField(inputField, userToken, callbackWhenTimeout)
  }

  resetUsers(userId, userToken) {
    const user = this.users?.[userId]
    if (user) {
      this.users[userId].removeFocusField(userToken)
    } else {
      console.error("ResetUsers: User not found", userId)
    }
  }

  getUsersList() {
    let usersList = []
    for (let userId in this.users) {
      usersList.push({
        userId: userId,
        focusFieldsIndexedByUserToken:
          this.users[userId].focusFieldsIndexedByUserToken,
      })
    }
    return usersList
  }

  getFocusFields() {
    let focusFields = {}
    for (let userId in this.users) {
      for (let userToken in this.users[userId].focusFieldsIndexedByUserToken) {
        let inputField =
          this.users[userId].focusFieldsIndexedByUserToken[userToken]
        if (inputField) {
          focusFields[inputField] = { userId, userToken }
        }
      }
    }
    return focusFields
  }

  static formatYturn(turnObj) {
    const ywords = Y.Array.from(turnObj.words)
    const ySegment = new Y.Text(turnObj.segment)
    const yturn = new Y.Map(Object.entries(turnObj))
    yturn.set("words", ywords)
    yturn.set("segment", ySegment)
    return yturn
  }

  static createSpeaker(name) {
    let yspeaker = new Y.Map()
    yspeaker.set("speaker_name", new Y.Text(name))
    yspeaker.set("speaker_id", uuidv4())
    return yspeaker
  }

  static mergeUpdates(deltas) {
    return Y.mergeUpdates(deltas)
  }
}

export class User {
  constructor(userId) {
    this.userId = userId
    this.focusFieldsIndexedByUserToken = {}
    this.timeouts = {}
    this.callbackWhenTimeout = {}
  }

  addFocusField(inputField, userToken, callbackWhenTimeout) {
    this.focusFieldsIndexedByUserToken[userToken] = inputField
    this.callbackWhenTimeout[userToken] = callbackWhenTimeout
    this.refreshFocusField(userToken)
  }

  removeFocusField(userToken) {
    this.focusFieldsIndexedByUserToken[userToken] = null
    clearTimeout(this.timeouts[userToken])
  }

  refreshFocusField(userToken) {
    if (this.timeouts[userToken]) clearTimeout(this.timeouts[userToken])
    this.timeouts[userToken] = setTimeout(() => {
      this.removeFocusField(userToken)
      this.callbackWhenTimeout[userToken]()
    }, 30000)
  }
}
