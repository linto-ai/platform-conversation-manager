/****************
 ****Delivery*****
 *****************/

const ExceptionType = "delivery"

class DeliveryError extends Error {
  constructor(message, err) {
    super()
    this.name = "DeliveryError"
    this.type = ExceptionType
    this.status = "400"
    if (message) this.message = message
    else this.message = "Keyword extraction error"
    if (err) this.err = err
  }
}

class DeliveryNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "DeliveryNotFound"
    this.type = ExceptionType
    this.status = "404"
    if (message) this.message = message
    else this.message = "Requested delivery session not found"
    if (err) this.err = err
  }
}

class DeliveryUnknowType extends Error {
  constructor(message, err) {
    super()
    this.name = "DeliveryUnknowType"
    this.type = ExceptionType
    this.status = "400"
    if (message) this.message = message
    else this.message = "Requested type is not supported"
    if (err) this.err = err
  }
}

class DeliveryUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "DeliveryUnsupportedMediaType"
    this.type = ExceptionType
    this.status = "415"
    if (message) this.message = message
    else this.message = "Request parameter is not supported"
    if (err) this.err = err
  }
}

module.exports = {
  DeliveryError,
  DeliveryNotFound,
  DeliveryUnknowType,
  DeliveryUnsupportedMediaType,
}
