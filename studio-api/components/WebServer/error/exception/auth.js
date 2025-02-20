/****************
 ******Auth*******
 *****************/
const ExceptionType = "auth"

class InvalidCredential extends Error {
  constructor(message, err) {
    super()
    this.name = "InvalidCredential"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = "Invalid credentials"
    if (err) this.err = err
  }
}

class UnableToGenerateKeyToken extends Error {
  constructor(message, err) {
    super()
    this.name = "UnableToGenerateKeyToken"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = "Unable to generate the keyToken"
    if (err) this.err = err
  }
}

class UserNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "UserNotFound"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = "Invalid credentials"
    if (err) this.err = err
  }
}

class MultipleUserFound extends Error {
  constructor(message, err) {
    super()
    this.name = "MultipleUserFound"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else
      this.message =
        "Multiple user have been found, please check with an administrator"
    if (err) this.err = err
  }
}

/****************
 ***Passport******
 ****************/

class MalformedToken extends Error {
  constructor(message, err) {
    super()
    this.name = "MalformedToken"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = "Malformed token"
    if (err) this.err = err
  }
}

class ExpiredLink extends Error {
  constructor(message, err) {
    super()
    this.name = "ExpiredLink"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = "Link is expired"
    if (err) this.err = err
  }
}

class DisabledUser extends Error {
  constructor(message, err) {
    super()
    this.name = "DisabledUser"
    this.type = ExceptionType
    this.status = 423
    if (message) this.message = message
    else
      this.message =
        "Your account is disabled. Contact support to reactivate it."
    if (err) this.err = err
  }
}

class Unauthorized extends Error {
  constructor(message, err) {
    super()
    this.name = "DisabledUser"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = "You are not authorized to access this resource"
    if (err) this.err = err
  }
}

module.exports = {
  //Auth Exception
  InvalidCredential,
  MultipleUserFound,
  UnableToGenerateKeyToken,
  UserNotFound,
  DisabledUser,
  //Passport Exception
  Unauthorized,
  MalformedToken,
  ExpiredLink,
}
