const debug = require('debug')(`linto:components:MongoMigration:controllers:schema:token`)

module.exports = async function (db, collectionName) {
  try {
    if (!collectionName) return

    if (process.env.DB_MODE === 'postgreSQL')
      await db.collection(collectionName).createIndex({ createdAt: 1 }) // TODO: How to set TTL index in postgreSQL?
    else
      await db.collection(collectionName).createIndex({ createdAt: 1 }, { expireAfterSeconds: 1209600 }) // 14 days in seconds

    console.log(`Collection "${collectionName}" with TTL index created successfully.`)
  } catch (error) {
    console.error('Error creating collection:', error)
  }
}