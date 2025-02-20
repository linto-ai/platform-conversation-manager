import ora from "ora"
import process from "process"
import * as dotenv from "dotenv"
import path from "path"
import Debug from "debug"

class App {
  constructor() {
    console.log("Starting web server")
    try {
      dotenv.config({ path: path.resolve(process.cwd(), ".env") })
      dotenv.config({ path: path.resolve(process.cwd(), ".envdefault") })
      this.components = {}
      Debug.enable(process.env.WEBSOCKET_DEBUG)
      process.env.COMPONENTS
        ? this.loadComponents()
        : console.log("No components registered")
    } catch (e) {
      console.error(e)
    }
  }

  async loadComponents() {
    process.env.COMPONENTS.split(",")
      .reduce((prev, componentFolderName) => {
        return prev.then(async () => {
          await this.use(componentFolderName)
        })
      }, Promise.resolve())
      .then(() => {})
  }

  async use(componentFolderName) {
    let spinner = ora(`Registering component : ${componentFolderName}`).start()
    try {
      // Component dependency injections with inversion of control based on events emitted between components
      // Component is an async singleton - requiring it returns a reference to an instance
      const componentImport = await import(
        `./components/${componentFolderName}/index.js`
      )
      const component = await new componentImport.default(this)
      this.components[component.id] = component // We register the instancied component reference in app.components object
      spinner.succeed(`Registered component : ${component.id}`)
    } catch (e) {
      if (e.name == "COMPONENT_MISSING") {
        return spinner.warn(
          `Skipping ${componentFolderName} - this component depends on : ${e.missingComponents}`,
        )
      }
      spinner.fail(`Error in component loading : ${componentFolderName}`)
      console.error(e)
      process.exit(1)
    }
  }
}

new App()
