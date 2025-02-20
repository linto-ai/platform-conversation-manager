/****************
 *****Keyword*****
 *****************/

const ExceptionType = "keyword"

class KeywordError extends Error {
  constructor(message, err) {
    super()
    this.name = "KeywordError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Keyword extraction error"
    if (err) this.err = err
  }
}

class KeywordMetadataRequire extends Error {
  constructor(message, err) {
    super()
    this.name = "KeywordMetadataRequire"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Metadata was not provided."
    if (err) this.err = err
  }
}

class KeywordUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "KeywordUnsupportedMediaType"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = "Request parameter is not supported"
    if (err) this.err = err
  }
}

module.exports = {
  KeywordError,
  KeywordMetadataRequire,
  KeywordUnsupportedMediaType,
}
