const debug = require("debug")(
  "linto:components:WebServer:controller:file:urlExtractor",
)

const { spawn } = require("child_process")
const { v4: uuidv4 } = require("uuid")
const { getAudioFolder, getStorageFolder } = require(
  `${process.cwd()}/components/WebServer/controllers/files/store`,
)

const { ConversationURLExtractorError } = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

async function downloadAudio(url, domain) {
  try {
    const fileName = uuidv4()
    const filePath = getStorageFolder() + "/" + getAudioFolder()

    if (domain === undefined) domain = "all"
    const args = [
      url,
      "--use-extractors",
      domain,
      "--output",
      fileName,
      "--paths",
      filePath,
      "--extract-audio",
      "--audio-format",
      "mp3",
    ]
    let streamProcess = spawn("yt-dlp", args)
    await handleStreamProcess(streamProcess)

    return {
      filePath: filePath + "/" + fileName + ".mp3",
      name: fileName,
    }
  } catch (err) {
    throw new ConversationURLExtractorError("Unable to download audio from URL")
  }
}

async function handleStreamProcess(streamProcess) {
  try {
    return new Promise((resolve, reject) => {
      streamProcess.stdout.on("data", (data) => {
        debug(`stdout: ${data}`)
      })

      streamProcess.stderr.on("data", (data) => {
        debug(`stderr: ${data}`)
      })

      streamProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code: ${code}`))
        } else {
          resolve()
        }
      })
    })
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = { downloadAudio }

// downloadAudio('https://www.youtube.com/watch?v=zwMeYjQOBjk', 'all')
