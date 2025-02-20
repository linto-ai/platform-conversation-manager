const debug = require("debug")(
  `linto:components:MongoMigration:controllers:migration`,
)

//read all folder in version 1
const INIT_VERSION = "0.0.0"

const fs = require("fs")
const fsPromises = require("fs").promises

module.exports = {
  async migrationProcessing(db, version) {
    try {
      const availabelVersion = fs.readdirSync(
        `${process.cwd()}/components/MongoMigration/version/`,
      )
      //check if desired version is available

      const desired_index = availabelVersion.indexOf(
        version.desired_version.toString(),
      )
      const current_index = availabelVersion.indexOf(
        version.current_version.toString(),
      )

      if (desired_index === -1 || current_index === -1) {
        console.error(
          "Error, desired version not found " +
            version.desired_version +
            ". Version range " +
            availabelVersion,
        )
        return
      }

      const version_diff = desired_index - current_index
      if (version_diff !== 0) {
        if (version_diff > 0) {
          for (let i = current_index + 1; i <= desired_index; i++) {
            await doMigration(availabelVersion[i], db, "up")
          }
        } else {
          for (let i = current_index; i > desired_index; i--) {
            await doMigration(availabelVersion[i], db, "down")
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  },

  async checkVersion(db, desired_version) {
    try {
      let current_version = desired_version

      const collectionsList = await db.listCollections().toArray()
      const versionCollection = collectionsList.filter(
        (c) => c.name === "version",
      )

      if (versionCollection.length === 0) {
        await db.createCollection("version")
        current_version = INIT_VERSION
        await db.collection("version").insertOne({ version: INIT_VERSION })
      } else {
        current_version = (await db.collection("version").findOne()).version
      }

      let version = {
        current_version: current_version,
        desired_version: desired_version,
      }

      return version
    } catch (err) {
      console.error(err)
    }
  },
}

async function doMigration(versionStep, db, step) {
  try {
    const migrationFiles = await fsPromises.readdir(
      `${process.cwd()}/components/MongoMigration/version/${versionStep}`,
    )
    if (step === "up")
      console.log(`Migration ${step} to version ${versionStep}`)
    else console.log(`Migration ${step} from version ${versionStep}`)

    for (let j = 0; j < migrationFiles.length; j++) {
      const file = migrationFiles[j]
      const migration = require(
        `${process.cwd()}/components/MongoMigration/version/${versionStep}/${file}`,
      )

      if (step === "up") {
        await migration.up(db)
      } else if (step === "down") {
        await migration.down(db)
      } else {
        console.error("Error, step not found")
      }
    }
  } catch (err) {
    console.error(err)
  }
}
