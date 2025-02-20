const Component = require(`../component.js`)
const debug = require("debug")(`linto:components:MongoMigration`)

const migration = require("./controllers/migration")
const MongoDriver = require(`${process.cwd()}/lib/mongodb/driver`)

const TIMEOUT = 500
let migration_version = 1

class MongoMigration extends Component {
  constructor(app) {
    super(app)
    this.app = app
    this.id = this.constructor.name
    this.db = MongoDriver.constructor.db

    if (process.env.DB_MIGRATION_TARGET) {
      migration_version = process.env.DB_MIGRATION_TARGET
    }

    return this.init()
  }

  async migrate() {
    // Make sure that mongo driver is connected
    var interval = setInterval(() => {
      if (this.db) {
        clearInterval(interval)
        this.doMigrate()
      }
    }, TIMEOUT)
  }

  async doMigrate() {
    // require drivers to be connected
    let version = await migration.checkVersion(this.db, migration_version)
    migration.migrationProcessing(this.db, version)

    return this
  }
}

module.exports = (app) => new MongoMigration(app)
