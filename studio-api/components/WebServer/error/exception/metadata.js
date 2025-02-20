/****************
 *****metadata****
 *****************/

const ExceptionType = "tag"

class MetadataError extends Error {
  constructor(message, err) {
    super()
    this.name = "MetadataError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = `Metadata error`
    if (err) this.err = err
  }
}

class MetadataNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "MetadataNotFound"
    this.type = ExceptionType
    this.status = 404
    if (message) this.message = message
    else this.message = `Metadata not found`
    if (err) this.err = err
  }
}

class MetadataUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "MetadataUnsupportedMediaType"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = `Metadata unsupported media type`
    if (err) this.err = err
  }
}

module.exports = {
  MetadataError,
  MetadataNotFound,
  MetadataUnsupportedMediaType,
}
