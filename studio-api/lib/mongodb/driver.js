const mongoDb = require("mongodb")
const { MongoClient } = require("mongodb")

const index = require("./index/init.js")
const user = require("./populate/init.js")

let urlMongo = "mongodb://"

//user access
if (process.env.DB_REQUIRE_LOGIN === "true")
  urlMongo += process.env.DB_USER + ":" + process.env.DB_PASS + "@"

urlMongo += process.env.DB_HOST + ":" + process.env.DB_PORT + "/"

if (process.env.DB_REQUIRE_LOGIN === "true")
  urlMongo += "?authSource=" + process.env.DB_NAME

// Create an instance of a MongoDb client. Handle connection/close connection/reconnect/error
class MongoDriver {
  static db
  static mongoDb = mongoDb
  static urlMongo = urlMongo
  // static client = mongoDb.MongoClient
  static client = new MongoClient(MongoDriver.urlMongo, {
    connectTimeoutMS: 5000,
    maxPoolSize: 40, // Adjust the pool size as needed
  })

  // Check mongo db connection status
  static checkConnection() {
    try {
      if (!!MongoDriver.db && MongoDriver.db.serverConfig) {
        return MongoDriver.db.serverConfig.isConnected()
      } else {
        return false
      }
    } catch (error) {
      console.error(error)
      return false
    }
  }

  static async connect() {
    if (!MongoDriver.db) {
      try {
        await MongoDriver.client.connect()
        console.log("> MongoDB : Connected")
        MongoDriver.db = MongoDriver.client.db(process.env.DB_NAME)
        console.log(
          `> MongoDB : Successfully connected to database "${process.env.DB_NAME}"`,
        )

        // Event handling
        MongoDriver.client.on("close", () => {
          console.error("> MongoDb : Connection lost")
        })
        MongoDriver.client.on("error", (e) => {
          console.error("> MongoDb ERROR: ", e)
        })
        MongoDriver.client.on("reconnect", () => {
          console.error("> MongoDb : Reconnected")
        })

        // Optionally, create indexes
        index.createIndex(MongoDriver)
        user.createSuperAdmin()
      } catch (err) {
        console.error("> MongoDB ERROR unable to connect:", err)
      }
    }
  }

  constructor() {
    if (!MongoDriver.checkConnection()) {
      MongoDriver.connect()
    }
  }
}

module.exports = new MongoDriver()
