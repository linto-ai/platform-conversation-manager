const debug = require('debug')('linto:conversation-manager:config')
const dotenv = require('dotenv')
const fs = require('fs')

function ifHas(element, defaultValue) {
    if (!element) return defaultValue
    return element
}

function configureDefaults() {
    try {
        dotenv.config() // loads process.env from .env file (if not specified by the system)
        const envdefault = dotenv.parse(fs.readFileSync('.envdefault')) // default usable values

        // Webserver Settings
        process.env.COMPONENTS = ifHas(process.env.COMPONENTS, envdefault.COMPONENTS)
        process.env.WEBSERVER_HTTP_PORT = ifHas(process.env.WEBSERVER_HTTP_PORT, envdefault.WEBSERVER_HTTP_PORT)

        // Mongo
        process.env.DB_MODE = ifHas(process.env.DB_MODE, envdefault.DB_MODE)
        process.env.DB_HOST = ifHas(process.env.DB_HOST, envdefault.DB_HOST)
        process.env.DB_USER = ifHas(process.env.DB_USER, envdefault.DB_USER)
        process.env.DB_PASS = ifHas(process.env.DB_PASS, envdefault.DB_PASS)
        process.env.DB_PORT = ifHas(process.env.DB_PORT, envdefault.DB_PORT)
        process.env.DB_NAME = ifHas(process.env.DB_NAME, envdefault.DB_NAME)
        process.env.DB_REQUIRE_LOGIN = ifHas(process.env.DB_REQUIRE_LOGIN, envdefault.DB_REQUIRE_LOGIN)

        // Cross domain accessibility
        process.env.CORS_ENABLED = ifHas(process.env.CORS_ENABLED, envdefault.CORS_ENABLED)
        process.env.CORS_API_WHITELIST = ifHas(process.env.CORS_API_WHITELIST, envdefault.CORS_API_WHITELIST)

        // Express settings
        process.env.EXPRESS_SIZE_FILE_MAX = ifHas(process.env.EXPRESS_SIZE_FILE_MAX, envdefault.EXPRESS_SIZE_FILE_MAX)
        process.env.AXIOS_SIZE_FILE_MAX = ifHas(process.env.AXIOS_SIZE_FILE_MAX, envdefault.AXIOS_SIZE_FILE_MAX)

        process.env.GATEWAY_SERVICES = ifHas(process.env.GATEWAY_SERVICES, envdefault.GATEWAY_SERVICES)
        process.env.MAX_SUBTITLE_VERSION = ifHas(process.env.MAX_SUBTITLE_VERSION, envdefault.MAX_SUBTITLE_VERSION)

        // Storage folder for uploads
        process.env.VOLUME_FOLDER = 'storages'
        process.env.VOLUME_AUDIO_PATH = 'audios'
        process.env.VOLUME_PROFILE_PICTURE_PATH = 'pictures'
        process.env.VOLUME_AUDIO_WAVEFORM_PATH = 'audiowaveform'

        // Passeport settings
        process.env.CM_JWT_SECRET = ifHas(process.env.CM_JWT_SECRET, envdefault.CM_JWT_SECRET)
        process.env.CM_REFRESH_SECRET = ifHas(process.env.CM_REFRESH_SECRET, envdefault.CM_REFRESH_SECRET)

        process.env.DISABLE_USER_CREATION = ifHas(process.env.DISABLE_USER_CREATION, envdefault.DISABLE_USER_CREATION)

    } catch (e) {
        console.error(debug.namespace, e)
        process.exit(1)
    }
}
module.exports = configureDefaults()