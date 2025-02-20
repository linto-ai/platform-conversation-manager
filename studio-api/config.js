const debug = require("debug")("linto:conversation-manager:config")
const dotenv = require("dotenv")
const fs = require("fs")

const ifHas = (element, defaultValue) => element || defaultValue

const loadEnvFile = (filePath) => dotenv.parse(fs.readFileSync(filePath))

function configureDefaults() {
  try {
    dotenv.config() // Load process.env from .env file
    const envdefault = loadEnvFile(".envdefault") // Default usable values

    // Loop over each key in the envdefault and set process.env if not already set
    Object.keys(envdefault).forEach((key) => {
      process.env[key] = ifHas(process.env[key], envdefault[key])
    })

    // Storage folder for uploads
    process.env.VOLUME_FOLDER = "storages"
    process.env.VOLUME_AUDIO_PATH = "audios"
    process.env.VOLUME_PROFILE_PICTURE_PATH = "pictures"
    process.env.VOLUME_AUDIO_SESSION_PATH = "session_audio"
  } catch (e) {
    console.error(debug.namespace, e)
    process.exit(1)
  }
}

module.exports = configureDefaults()
