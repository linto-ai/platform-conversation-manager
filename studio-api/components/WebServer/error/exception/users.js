/****************
 *****Users*******
 *****************/

const ExceptionType = "users"

class UserError extends Error {
  constructor(message, err) {
    super()
    this.name = "UserError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Error during the operation"
    if (err) this.err = err
  }
}

class UserConflict extends Error {
  constructor(message, err) {
    super()
    this.name = "UserConflict"
    this.type = ExceptionType
    this.status = 409
    if (message) this.message = message
    else this.message = "User address already use"
    if (err) this.err = err
  }
}

class UserForbidden extends Error {
  constructor(message, err) {
    super()
    this.name = "UserForbidden"
    this.type = ExceptionType
    this.status = 403
    if (message) this.message = message
    else this.message = "Not allowed to do this"
    if (err) this.err = err
  }
}

class UserNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "UserNotFound"
    this.type = ExceptionType
    this.status = 404
    if (message) this.message = message
    else this.message = "User not found"
    if (err) this.err = err
  }
}

class UserUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "UserUnsupportedMediaType"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = "Parameter is not supported"
    if (err) this.err = err
  }
}

class GenerateMagicLinkError extends Error {
  constructor(message, err) {
    super()
    this.name = "GenerateMagicLinkError"
    this.type = ExceptionType
    this.status = 424 // Method failure
    if (message) this.message = message
    else this.message = "Error on generating authentication link."
    if (err) this.err = err
  }
}

module.exports = {
  UserConflict,
  UserError,
  UserForbidden,
  UserNotFound,
  UserUnsupportedMediaType,
  GenerateMagicLinkError,
}
