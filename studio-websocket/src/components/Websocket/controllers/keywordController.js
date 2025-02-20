import Debug from "debug"

import Conversations from "../models/conversations.js"
import {
  apiGetKeywords,
  apiGetJobs,
  apiGenerateKeywords,
} from "../request/index.js"

const jobsFetcher = {}

const debug = Debug("Websocket:debug:keywordController")
const debugJob = Debug("Websocket:debug:keywordController:jobFetcher")

export default async function keywordController({ conversationId, userToken }) {
  const socket = this
  const conversation = Conversations.getById(conversationId)
  const keywords = conversation.getKeywords()
  if (keywords && keywords.length > 0) {
    debug("keywords already fetched")
    send(conversation, conversationId, socket)
  } else {
    if (!jobsFetcher[conversationId]) {
      debug("request keywords")
      const res = await apiGenerateKeywords(conversationId, userToken)
      debug("keywords requested")
      if (res.status == "error") {
        debug("error while requesting keywords")
        debug(res)

        conversation.setKeywordsJob({ state: "error" })
        send(conversation, conversationId, socket)
        return
      }
      debug("set keywords job")
      jobsFetcher[conversationId] = true
      fetchJob(conversation, conversationId, userToken, socket)
    } else {
      debug("keyword job already running")
    }
    // request keywords
  }
}

async function fetchJob(conversation, conversationId, userToken, socket) {
  // check if job is not done
  const jobs = await apiGetJobs(conversationId, userToken)
  debugJob("Feched jobs:")
  debugJob(jobs)
  const orgaId = conversation.getOrganizationId()
  conversation.setKeywordsJob(jobs?.keyword)
  send(conversation, conversationId, socket)
  if (
    conversation.getKeywordsJob()?.state !== "error" &&
    conversation.getKeywordsJob()?.state !== "done"
  ) {
    // fetch job
    setTimeout(
      () => fetchJob(conversation, conversationId, userToken, socket),
      3000,
    )
  } else {
    // fetch keywords
    debug("Job done or error")
    const keywords = await apiGetKeywords(conversationId, orgaId, userToken)
    debug("Feched keywords:", keywords)
    conversation.setKeywords(keywords)
    jobsFetcher[conversationId] = false
    send(conversation, conversationId, socket)
  }
}

async function send(conversation, conversationId, socket) {
  const keywords = conversation.getKeywords()
  const job = conversation.getKeywordsJob()
  socket.emit("keywords_update", { keywords, job })
  socket.broadcast
    .to(`conversation/${conversationId}`)
    .emit("keywords_update", { keywords, job })
}
