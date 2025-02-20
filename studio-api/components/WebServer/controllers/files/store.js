const debug = require("debug")("linto:components:WebServer:controller:store")

const { v4: uuidv4 } = require("uuid")
const fs = require("fs")
const path = require("path")

const { transformAudio, mergeAudio, mergeChannel } = require(
  `${process.cwd()}/components/WebServer/controllers/files/transform`,
)

/*
ffmpeg -i in.whatever -vn -ar 16000 -ac 1 -b:a 96k out.mp3
ffmpeg -i in.whatever -vn -c:a aac -ar 16000 -ac 1 -b:a 64k out.m4a
ffmpeg -i in.whatever -vn -c:a libfdk_aac -ar 16000 -ac 1 -b:a 64k out.m4a (best version, requires specific build for ffmpeg)
*/

async function storeFile(files, type = "audio") {
  try {
    const fileName = uuidv4()

    if (type === "picture") {
      const fileExtension = path.extname(files.name)

      fs.writeFileSync(
        `${getStorageFolder()}/${getPictureFolder()}/${fileName}${fileExtension}`,
        files.data,
      )
      return `${getPictureFolder()}/${fileName}${fileExtension}`
    } else if (type === "multi_audio") {
      let tmp_stored_file = []

      const store_path = `${getStorageFolder()}/${getAudioFolder()}`
      const audio_merged = `${store_path}/${fileName}.mp3`
      const audio_merged_channel = `${store_path}_multiple_chanel.mp3`

      files.file.map((file) => {
        const filePath = `${store_path}/${uuidv4()}_tmp${path.extname(file.name)}`
        fs.writeFileSync(filePath, file.data)
        tmp_stored_file.push(filePath)
      })

      await mergeAudio(tmp_stored_file, audio_merged)
      // await mergeChannel(tmp_stored_file, audio_merged_channel)

      tmp_stored_file.map((tmp_file) => {
        deleteFile(tmp_file)
      })

      return {
        filePath: `${process.env.VOLUME_AUDIO_PATH}/${fileName}.mp3`,
        storageFilePath: audio_merged,
        storageFilePathChanel: audio_merged_channel,
        filename: fileName,
      }
    } else if (type === "audio") {
      const fileExtension = path.extname(files.name)
      const store_path = `${getStorageFolder()}/${getAudioFolder()}/${fileName}`
      const output_audio = `${store_path}.mp3`

      let filePath = `${store_path}_tmp${fileExtension}` // origine file
      if (files.filePath) {
        // we are in URL mode
        filePath = files.filePath
        await transformAudio(files.filePath, output_audio)
      } else {
        fs.writeFileSync(filePath, files.data)
        await transformAudio(filePath, output_audio)
      }

      deleteFile(filePath)
      return {
        filePath: `${process.env.VOLUME_AUDIO_PATH}/${fileName}.mp3`,
        storageFilePath: output_audio,
        filename: files.name,
      }
    }
  } catch (error) {
    throw error
  }
}

function defaultPicture() {
  return `pictures/default.jpg`
}

function deleteFile(filePath) {
  try {
    fs.unlinkSync(filePath)
  } catch (error) {
    debug("File not found to be deleted : ", filePath)
  }
}

function getStorageFolder() {
  return process.env.VOLUME_FOLDER
}

function getPictureFolder() {
  return process.env.VOLUME_PROFILE_PICTURE_PATH
}

function getAudioFolder() {
  return process.env.VOLUME_AUDIO_PATH
}

function getAudioSessionFolder() {
  return process.env.VOLUME_AUDIO_SESSION_PATH
}

module.exports = {
  storeFile,
  defaultPicture,
  deleteFile,
  getStorageFolder,
  getPictureFolder,
  getAudioFolder,
}
