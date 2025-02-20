/****************
 ********Tag******
 *****************/

const ExceptionType = "tag"

class TagError extends Error {
  constructor(message, err) {
    super()
    this.name = "TagError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = `Tag error`
    if (err) this.err = err
  }
}

class TagConflict extends Error {
  constructor(message, err) {
    super()
    this.name = "TagConflict"
    this.type = ExceptionType
    this.status = 409
    if (message) this.message = message
    else this.message = `Tag conflict`
    if (err) this.err = err
  }
}

class TagNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "TagNotFound"
    this.type = ExceptionType
    this.status = 404
    if (message) this.message = message
    else this.message = `Tag not found`
    if (err) this.err = err
  }
}

class TagUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "TagUnsupportedMediaType"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = `Tag unsupported media type`
    if (err) this.err = err
  }
}

module.exports = {
  TagError,
  TagConflict,
  TagNotFound,
  TagUnsupportedMediaType,
}
