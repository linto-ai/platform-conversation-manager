const ExceptionType = "mongo"

class MongoError extends Error {
  constructor(message, err) {
    super()
    this.name = "MongoError"
    this.type = ExceptionType
    this.status = "500"

    if (message) this.message = message
    else this.message = "Server error"
    if (err) this.err = err
  }
}

module.exports = {
  MongoError,
}
