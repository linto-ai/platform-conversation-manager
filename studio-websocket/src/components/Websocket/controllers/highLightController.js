import Debug from "debug"
import Conversations from "../models/conversations.js"
import { apiGenerateKeywords } from "../request/index.js"
import { v4 as uuidv4 } from "uuid"

const debug = Debug("Websocket:debug:hightLightController")

export default async function hightLightController(
  { conversationId, userToken, serviceScope, categoryName, categoryId },
  io,
) {
  if (!categoryName || !conversationId || !userToken) {
    return
  }

  let conversation = Conversations.getById(conversationId)

  if (!conversation) {
    this.emit("error")
  }

  highLightFetchJob(
    conversation,
    conversationId,
    userToken,
    io,
    this,
    serviceScope,
    categoryName,
    categoryId,
    true,
  )
}

async function highLightFetchJob(
  conversation,
  conversationId,
  userToken,
  io,
  socket,
  serviceScope,
  categoryName,
  categoryId,
  erase = false,
) {
  try {
    const room = `conversation/${conversationId}`
    const job = conversation.jobs[categoryName]
    if (!erase && job.state && (job.state == "done" || job.state == "error")) {
      debug("Job done", job.state, "for", categoryName)
    } else {
      if (
        job.state == "not_started" ||
        (erase && (job.state == "done" || job.state == "error"))
      ) {
        // TODO: generalize for all highlight types
        switch (categoryName) {
          case "keyword":
            let res = await apiGenerateKeywords(conversationId, userToken)
            if (res.status == "error") {
              socket.emit("error")
              return
            }
            break
          default:
            debug("No job to start for", categoryName)
            return
        }
      } else if (erase) {
        debug("No job to erase for", categoryName)
        return
      }

      await job.fetchJob(userToken)
      setTimeout(
        () =>
          highLightFetchJob(
            conversation,
            conversationId,
            userToken,
            io,
            socket,
            serviceScope,
            categoryName,
            categoryId,
          ),
        3000,
      )
      io.to(room).emit("hightlight_update", {
        job: conversation.jobs[categoryName].toJSON(),
        categoryName,
        categoryId,
      })
    }
  } catch (error) {
    console.error(error)
    socket.emit("error")
  }
}
