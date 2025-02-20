const debug = require("debug")(
  "linto:components:WebServer:controller:file:tranform",
)

const { spawn } = require("child_process")
const ARG_TRANSFORM = ["-vn", "-ar", "16000", "-ac", "1", "-b:a", "96k"]
/*
ffmpeg -i in.whatever -vn -ar 16000 -ac 1 -b:a 96k out.mp3
ffmpeg -i in.whatever -vn -c:a aac -ar 16000 -ac 1 -b:a 64k out.m4a
ffmpeg -i in.whatever -vn -c:a libfdk_aac -ar 16000 -ac 1 -b:a 64k out.m4a (best version, requires specific build for ffmpeg)
*/

// check ogg format
async function transformAudio(filePath, transformedFilePath) {
  let streamProcess = spawn(
    "ffmpeg",
    ["-i", `${filePath}`, ...ARG_TRANSFORM, transformedFilePath],
    { detached: true },
  )
  await handleStreamProcess(streamProcess)
}

async function mergeAudio(files, audioPath) {
  let fileList = []
  let filter_complex = ""
  files.map((file, index) => {
    fileList.push("-i")
    fileList.push(file)
    filter_complex += `[${index}]`
  })
  filter_complex += `amerge=inputs=${files.length}`

  let streamProcess = spawn(
    "ffmpeg",
    [
      ...fileList,
      "-filter_complex",
      filter_complex,
      ...ARG_TRANSFORM,
      audioPath,
    ],
    { detached: true },
  )
  await handleStreamProcess(streamProcess)
}

async function mergeChannel(files, audioPath) {}

async function handleStreamProcess(streamProcess) {
  await new Promise((resolve, reject) => {
    streamProcess.stdout.on("data", (data) => {
      debug(`stdout: ${data}`)
    })

    streamProcess.stderr.on("data", (data) => {
      debug(`stderr - processing: ${data}`)
    })

    streamProcess.on("error", (error) => {
      reject(error)
      debug(`error: ${error.message}`)
    })

    streamProcess.on("close", (code) => {
      debug(`child process exited with code ${code}`)
      resolve()
    })
  })
}

module.exports = {
  transformAudio,
  mergeAudio,
  mergeChannel,
}
