const debug = require("debug")(
  `linto:components:MongoMigration:controllers:version:1.5.2:organization`,
)
const PERMISSIONS = require(`${process.cwd()}/lib/dao/organization/permissions`)

const collections_name = "organizations"

module.exports = {
  async up(db) {
    // Fetch all organizations
    const orgas = await db.collection(collections_name).find({}).toArray()

    // Get default permissions based on environment variable
    const defaultPermissions = PERMISSIONS.getDefaultPermissions()
    await Promise.all(
      orgas.map(async (orga) => {
        // Check if the organization already has a `permissions` field
        if (!orga.permissions || Object.keys(orga.permissions).length === 0) {
          // Update the organization with default permissions
          await db
            .collection(collections_name)
            .updateOne(
              { _id: orga._id },
              { $set: { permissions: defaultPermissions } },
            )
        }
      }),
    )
  },

  async down(db) {
    // Fetch all organizations
    const orgas = await db.collection(collections_name).find({}).toArray()

    await Promise.all(
      orgas.map(async (orga) => {
        // Remove the `permissions` field to revert to the previous state
        await db
          .collection(collections_name)
          .updateOne({ _id: orga._id }, { $unset: { permissions: "" } })
      }),
    )
  },
}
