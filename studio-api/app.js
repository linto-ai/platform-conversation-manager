const debug = require("debug")("linto:app:main")
const ora = require("ora")

class App {
  constructor() {
    try {
      // Load env variables
      require("./config")

      // Auto-loads components based on process.env.COMPONENTS list
      this.components = {}
      process.env.COMPONENTS.split(",")
        .reduce((prev, componentFolderName) => {
          return prev.then(async () => {
            await this.use(componentFolderName)
          })
        }, Promise.resolve())
        .then(async () => {
          if (this.components["WorkerWatcher"] !== undefined) {
            await this.components["WorkerWatcher"].discovery()
          }

          if (this.components["MongoMigration"] !== undefined) {
            await this.components["MongoMigration"].migrate()
            delete this.components["MongoMigration"]
          }
        })
    } catch (e) {
      console.error(debug.namespace, e)
    }
  }

  async use(componentFolderName) {
    let spinner = ora(`Registering component : ${componentFolderName}`).start()
    try {
      // Component dependency injections with inversion of control based on events emitted between components
      // Component is an async singleton - requiring it returns a reference to an instance
      const component = await require(
        `${__dirname}/components/${componentFolderName}`,
      )(this)
      this.components[component.id] = component // We register the instancied component reference in app.components object
      spinner.succeed(`Registered component : ${component.id}`)
    } catch (e) {
      if (e.name == "COMPONENT_MISSING") {
        return spinner.warn(
          `Skipping ${componentFolderName} - this component depends on : ${e.missingComponents}`,
        )
      }
      spinner.fail(`Error in component loading : ${componentFolderName}`)
      console.error(debug.namespace, e)
      process.exit(1)
    }
  }
}

module.exports = new App()
