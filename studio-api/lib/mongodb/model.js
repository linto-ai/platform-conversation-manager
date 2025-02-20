const debug = require("debug")(
  "linto:conversation-manager:models:mongodb:models",
)

const MongoDriver = require(`./driver`)

const { MongoError } = require(
  `${process.cwd()}/lib/mongodb/error/customErrors`,
)

class MongoModel {
  constructor(collection) {
    this.collection = collection
  }

  getObjectId(id) {
    return new MongoDriver.constructor.mongoDb.ObjectId(id)
  }

  createObjectId() {
    return new MongoDriver.constructor.mongoDb.ObjectId()
  }

  // Request function for Mongodb. Makes a request on the collection, filtered by the query.
  async mongoRequest(query, projection) {
    try {
      const collection = MongoDriver.constructor.db.collection(this.collection)
      const result = await collection.find(query).project(projection).toArray()
      return result // Use return if this is within an async function, otherwise resolve(result) if in a Promise
    } catch (error) {
      debug("mongoRequest error:", error)
      throw new MongoError(error) // Use throw if this is within an async function, otherwise reject(new MongoError(error)) if in a Promise
    }
  }

  async mongoAggregatePaginate(query, projection, paginate = {}) {
    const size = parseInt(paginate.size) || 100
    const page = parseInt(paginate.page) || 0
    const sortField = paginate.sortField || "_id"
    const sortCriteria = parseInt(paginate.sortCriteria) === -1 ? -1 : 1
    const sort = { [sortField]: sortCriteria, _id: sortCriteria }

    try {
      const aggregationPipeline = [
        { $match: query },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            paginatedResult: [
              { $sort: sort },
              { $skip: size * page },
              { $limit: size },
              { $project: projection }, // Projection for paginated results
            ],
          },
        },
      ]

      const collection = MongoDriver.constructor.db.collection(this.collection)
      const result = await collection.aggregate(aggregationPipeline).toArray()

      if (result[0].totalCount.length === 0) {
        return { count: 0, list: [] }
      } else {
        return {
          count: result[0].totalCount[0].count,
          list: result[0].paginatedResult,
        }
      }
    } catch (error) {
      debug("mongoAggregatePaginate error:", error)
      throw new MongoError(error)
    }
  }

  // Insert/Create ONE
  async mongoInsert(document) {
    try {
      const collection = MongoDriver.constructor.db.collection(this.collection)
      const result = await collection.insertOne(document)
      // Assuming `this.db` is your MongoDB database instance and `this.collection` is the target collection name

      if (result.acknowledged) {
        //result.insertedId.toString()
        return {
          success: true,
          message: "Document inserted successfully",
          insertedId: result.insertedId,
          insertedCount: 1,
        }
      } else {
        return {
          success: false,
          message: "Document insertion was not acknowledged",
        }
      }
    } catch (error) {
      console.error("Error in mongoInsert:", error)
      return {
        success: false,
        message: "Error inserting document",
        error: error,
      }
    }
  }

  /**
   * Update function for mongoDB. This function will update an entry based on the "collection", the "query" and the "values" passed in parmaters.
   * @param {Object} query
   * @param {Object} values
   * @returns {Pomise}
   */
  async mongoUpdate(query, values) {
    if (values._id) {
      delete values._id
    }

    try {
      const result = await MongoDriver.constructor.db
        .collection(this.collection)
        .updateOne(query, { $set: values })
      return result
    } catch (error) {
      debug("mongoUpdate error:", error)
      throw error // Rethrow the error after logging it
    }
  }

  // Update ONE, define update operator param
  async mongoUpdateOne(query, operator, values, filters) {
    if (values._id) {
      delete values._id
    }
    let payload = {}
    payload[operator] = values

    try {
      const result = await MongoDriver.constructor.db
        .collection(this.collection)
        .updateOne(query, payload, filters)
      return result
    } catch (error) {
      debug("mongoUpdateOne error:", error)
      throw error // Rethrow the error after logging it
    }
  }

  async mongoUpdateMany(query, values) {
    try {
      const result = await MongoDriver.constructor.db
        .collection(this.collection)
        .updateMany(query, { $set: values })
      return result
    } catch (error) {
      debug("mongoUpdateMany error:", error)
      throw error
    }
  }

  async mongoDelete(query) {
    try {
      const result = await MongoDriver.constructor.db
        .collection(this.collection)
        .deleteOne(query)
      return result
    } catch (error) {
      debug("mongoDelete error:", error)
      throw error // Rethrow the error to be handled by the caller
    }
  }

  async mongoDeleteMany(query) {
    try {
      const result = await MongoDriver.constructor.db
        .collection(this.collection)
        .deleteMany(query)
      return result
    } catch (error) {
      debug("mongoDeleteMany error:", error)
      throw error // Rethrow the error to be handled by the caller
    }
  }

  async mongoAggregate(pipeline) {
    try {
      const result = await MongoDriver.constructor.db
        .collection(this.collection)
        .aggregate(pipeline)
        .toArray()
      return result
    } catch (error) {
      debug("mongoAggregate error:", error)
      throw error // Rethrow the error to be handled by the caller
    }
  }
}

module.exports = MongoModel
