/****************
 **** Service ****
 *****************/

const ExceptionType = "service"

class ServiceError extends Error {
  constructor(message, err) {
    super()
    this.name = "ServiceError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Error during the operation"
    if (err) this.err = err
  }
}

module.exports = {
  ServiceError,
}
