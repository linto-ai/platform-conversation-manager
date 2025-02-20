const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:controllers:llm:index`,
)

const webSocketSingleton = require(
  `${process.cwd()}/components/WebServer/controllers/llm//llm_ws`,
)
let socket

const fs = require("fs")
const FormData = require("form-data")
const model = require(`${process.cwd()}/lib/mongodb/models`)
let isSocketConnected = false

async function generateText(conversation, metadata) {
  let prompt = ""

  conversation.text.map((turn) => {
    if (metadata.speakers) {
      prompt += turn.speaker_name + " : "
    }

    if (conversation.text.indexOf(turn) === conversation.text.length - 1) {
      prompt += turn.segment
      return
    } else {
      prompt += turn.segment + "\n"
    }
  })

  return prompt
}

async function request(query, conversation, metadata, conversationExport) {
  let content = await generateText(conversation, metadata)
  const tempFileName = `file_${query.format}_${conversation._id}.txt`

  return requestAPI(query, content, tempFileName, conversationExport)
}

async function requestAPI(query, content, fileName, conversationExport) {
  if (process.env.LLM_GATEWAY_SERVICES === undefined) {
    throw new Error("LLM_GATEWAY_SERVICES is not defined")
  }

  const fetch = await import("node-fetch")
  let url =
    process.env.LLM_GATEWAY_SERVICES + "/services/" + query.format + "/generate"

  const tempFilePath = "/tmp/" + fileName
  fs.writeFileSync(tempFilePath, content)

  let formData = new FormData()

  formData.append("flavor", query.flavor)
  formData.append("file", fs.createReadStream(tempFilePath), {
    filename: fileName,
    contentType: "text/plain",
  })

  let options = {
    method: "POST",
    headers: {
      ...formData.getHeaders(),
    },
    body: formData,
  }
  options.formData = formData

  let jobId = undefined
  try {
    const response = await fetch.default(url, options)
    const result = await response.json()
    jobId = result.jobId
  } catch (err) {
    jobId = undefined
    conversationExport.status = "error"
    model.conversationExport.updateStatus(conversationExport)
  }

  fs.unlinkSync(tempFilePath)
  initWebSocketConnection(conversationExport)
  return jobId
}

// Function to initialize or reuse the WebSocket connection
async function initWebSocketConnection(convExport) {
  if (webSocketSingleton.getSocketState() === 1) return
  socket = webSocketSingleton.getSocket() // Should init the socket

  if (convExport && convExport.jobId)
    webSocketSingleton._addToWatchingList(convExport.jobId)
}

// Function to add a job and manage the WebSocket lifecycle
async function processJobWithWebSocket(jobsId, conversationExport) {
  try {
    if (!jobsId) {
      throw new Error("Job ID is required")
    }
    initWebSocketConnection(conversationExport)
  } catch (err) {
    conversationExport.status = "error"
    conversationExport.error = err.message
    model.conversationExport.updateStatus(conversationExport)
  }
}

getSocketStatus = () => {
  return isSocketConnected
}

// return the state of the job if done or not
completedJob = (job) => {
  if (["complete", "error", "unknown"].includes(job.status)) return true
  return false
}

module.exports = {
  generateText,
  request,
  pollingLlm: processJobWithWebSocket,
  initWebSocketConnection,
  getSocketStatus,
}
