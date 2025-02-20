const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:llm:llm_ws`,
)
const WebSocket = require("ws")
const model = require(`${process.cwd()}/lib/mongodb/models`)

const appLogger = require(`${process.cwd()}/lib/logger/logger.js`)

class WebSocketSingleton {
  constructor() {
    if (!WebSocketSingleton.instance) {
      this.socket = null
      this.watchingList = new Set() // To keep track of tasks that are already being watched
      WebSocketSingleton.instance = this
    }
    return WebSocketSingleton.instance
  }

  getSocket(url = process.env.LLM_GATEWAY_SERVICES_WS) {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.socket = new WebSocket(url)

      this.socket.on("open", () => {
        appLogger.info(`[${Date.now()}] - [LLM WS] connected.`)
      })

      this.socket.on("message", (message) => {
        this.handleMessage(message) // Handle message and update task ID
      })

      this.socket.on("close", () => {
        appLogger.info(`[${Date.now()}] - [LLM WS] closed.`)
        this.socket = null // Reset the socket on close
      })

      this.socket.on("error", (error) => {
        appLogger.error(`[${Date.now()}] - [LLM WS] : ${error}`)
        console.error("WebSocket error:", error)
      })
    }
    return this.socket
  }

  getSocketState() {
    // CONNECTING (0): The WebSocket connection is in the process of establishing.
    // OPEN (1): The WebSocket connection is established and ready to use.
    // CLOSING (2): The WebSocket connection is closing.
    // CLOSED (3): The WebSocket connection is closed.
    if (!this.socket) {
      return WebSocket.CLOSED // Return CLOSED state (3) if no socket exists
    }
    return this.socket.readyState
  }

  sendMessage(message) {
    const socket = this.getSocket() // Ensure the socket is initialized
    if (socket.readyState === WebSocket.OPEN) {
      const idsToAdd = message.filter(
        (taskId) => !this.watchingList.has(taskId),
      )
      if (idsToAdd.length > 0) {
        idsToAdd.forEach((taskId) => {
          this.watchingList.add(taskId)
          debug(`Task ID ${taskId} added to the watching list.`)
        })
        appLogger.info(`[${Date.now()}] - [LLM WS] Message sent : ${idsToAdd}`)
        socket.send(JSON.stringify(idsToAdd))
      } else {
        debug("All task IDs are already in the watching list.")
      }
    } else {
      appLogger.warn(
        `[${Date.now()}] - [LLM WS] Not connected, cannot send message.`,
      )
      console.error(
        `Cannot send message. WebSocket is not open. Current state: ${socket.readyState}`,
      )
    }
  }

  // Handle WebSocket messages
  async handleMessage(message) {
    try {
      const parsedMessage = JSON.parse(message)
      if (parsedMessage.status === "alive") return
      debug("Receive message:", parsedMessage)

      const tasks = Array.isArray(parsedMessage)
        ? parsedMessage
        : [parsedMessage]

      appLogger.debug(
        `[${Date.now()}] - [LLM WS] Message : ${JSON.stringify(tasks)}`,
      )
      for (const task of tasks) {
        const { task_id, status } = task
        const conv = await model.conversationExport.getByJobId(task_id)

        if (conv.length === 0) continue // It's an unknown task from studio
        this.updateStatus(conv[0], task)

        if (this.completedJob(status)) {
          this._handleCompletedJob(task_id, status) // Handle completed job
        } else {
          this._addToWatchingList(task_id) // Add to watching list if not already there
        }
      }

      if (this.watchingList.size === 0) {
        appLogger.info(
          `[${Date.now()}] - [LLM WS] No more tasks. Closing WebSocket.`,
        )
        this.socket.close()
      }
    } catch (error) {
      console.error("Error handling message:", error)
    }
  }

  _addToWatchingList(taskId) {
    if (!taskId) return
    if (!this.watchingList.has(taskId)) {
      this.watchingList.add(taskId)
      appLogger.info(`[${Date.now()}] - [LLM WS] Watching task ${taskId}.`)
    }
  }

  _handleCompletedJob(taskId, status) {
    this.watchingList.delete(taskId)
    appLogger.info(
      `[${Date.now()}] - [LLM WS] Task ${taskId} completed : status ${status}.`,
    )
  }

  areJobsInWatchingList(jobIds) {
    return jobIds.every((jobId) => this.watchingList.has(jobId))
  }

  completedJob(status) {
    if (["complete", "error", "unknown"].includes(status)) return true
    return false
  }

  updateStatus(conversationExport, data) {
    let status = data.status
    conversationExport.status = status

    if (status === "complete" && data.message === "success") {
      conversationExport.data = data.summarization
      conversationExport.processing = data.progress || 100

      // we remove the task_id from the watching list
      this.watchingList.delete(data.task_id)
    } else if (status === "error" || status === "unknown") {
      conversationExport.data = data.error || data.message
    } else if (
      status === "queued" ||
      status === "processing" ||
      status === "started" ||
      status === "progress"
    ) {
      conversationExport.processing = data.progress
    }
    model.conversationExport.updateStatus(conversationExport)
  }
}

const singleton = new WebSocketSingleton()
module.exports = singleton
