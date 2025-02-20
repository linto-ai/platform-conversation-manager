const debug = require("debug")(`linto:components:webserver:apidoc:index`)

const fs = require("fs")
const path = require("path")

const mainDirectory = path.join(__dirname, "api")

function mergeModule(modules, loadModule) {
  Object.keys(loadModule).forEach(function (key) {
    let apidoc = loadModule[key]

    if (modules[key]) {
      modules[key] = {
        ...modules[key],
        ...apidoc,
      }
    } else {
      modules[key] = apidoc
    }
  })
  return modules
}

function loadModulesFromDirectory(directory) {
  const skipItems = ["transcriber_profiles", "sessions", "templates"]
  let modules = {}

  fs.readdirSync(directory).forEach((item) => {
    if (
      process.env.SESSION_API_ENDPOINT === "" &&
      skipItems.some((skipItem) => item.includes(skipItem))
    ) {
      return
    } else if (process.env.OIDC_TYPE === "" && item.includes("oidc")) {
      return
    }

    const itemPath = path.join(directory, item)

    if (fs.statSync(itemPath).isDirectory()) {
      let loadModule = loadModulesFromDirectory(itemPath)
      modules = mergeModule(modules, loadModule)
    } else if (item.endsWith(".json")) {
      modules = mergeModule(modules, require(itemPath))
    }
  })

  return modules
}

const jsonApiModules = loadModulesFromDirectory(mainDirectory)
const sortedKeys = Object.keys(jsonApiModules).sort()

const apiDoc = {}
for (const key of sortedKeys) {
  apiDoc[key] = jsonApiModules[key]
}

module.exports = apiDoc
