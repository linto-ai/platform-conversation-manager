const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.4:users`,
)
const collections_name = "users"

const ROLE = require(`${process.cwd()}/lib/dao/users/platformRole`)
const moment = require("moment")

module.exports = {
  up: async (db) => {
    const usersCollection = db.collection(collections_name)
    await db.collection(collections_name).updateMany(
      {}, // Apply to all documents
      {
        $set: {
          suspend: false,
          created: moment().format(),
          last_update: moment().format(),
        },
      },
    )

    // Fetch all users with roles other than USER
    const usersToUpdate = await usersCollection
      .find({
        role: { $exists: true, $ne: ROLE.userRole() },
      })
      .toArray()

    for (const user of usersToUpdate) {
      if (ROLE.hasPlatformRoleAccess(user.role, ROLE.SUPER_ADMINISTRATOR)) {
        continue //Should not happend in migration, but just in case user have already the desired platform role
      }
      updatedRole = ROLE.shiftBitsUp(user.role) + ROLE.ORGANIZATION_INITIATOR

      // Update the role in the database
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { role: updatedRole } },
      )
    }
  },

  down: async (db) => {
    const usersCollection = db.collection(collections_name)
    await db.collection(collections_name).updateMany(
      {}, // Apply to all documents
      { $unset: { suspend: "", created: "", last_update: "" } }, // Explicitly unset fields
    )
    // Fetch all users with roles other than USER
    // const usersToUpdate = await usersCollection
    //   .find({
    //     role: { $exists: true, $ne: ROLE.userRole() },
    //   })
    //   .toArray()
    // for (const user of usersToUpdate) {
    //   updatedRole = user.role - ROLE.ORGANIZATION_INITIATOR
    //   updatedRole = ROLE.shiftBitsUp(updatedRole)
    //   // Update the role in the database
    //   await usersCollection.updateOne(
    //     { _id: user._id },
    //     { $set: { role: updatedRole } },
    //   )
    // }
  },
}
