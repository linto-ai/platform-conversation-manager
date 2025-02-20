/****************
 **** Session ****
 *****************/

const ExceptionType = "session"

class SessionError extends Error {
  constructor(message, err) {
    super()
    this.name = "SessionError"
    this.type = ExceptionType
    this.status = "400"
    if (message) this.message = message
    else this.message = "Error during the operation"
    if (err) this.err = err
  }
}

class SessionNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "SessionNotFound"
    this.type = ExceptionType
    this.status = "404"
    if (message) this.message = message
    else this.message = "Requested session not found"
    if (err) this.err = err
  }
}

class SessionForbidden extends Error {
  constructor(message, err) {
    super()
    this.name = "SessionForbidden"
    this.type = ExceptionType
    this.status = "403"
    if (message) this.message = message
    else this.message = "Not allowed to do this"
    if (err) this.err = err
  }
}

class SessionNotStarted extends Error {
  constructor(message, err) {
    super()
    this.name = "TranscriberUnavailable"
    this.type = ExceptionType
    this.status = "400"
    if (message) this.message = message
    else this.message = "Session must be ready or active"
    if (err) this.err = err
  }
}

class TranscriberUnavailable extends Error {
  constructor(message, err) {
    super()
    this.name = "TranscriberUnavailable"
    this.type = ExceptionType
    this.status = "409"
    if (message) this.message = message
    else this.message = "Transcriber is not available at the moment"
    if (err) this.err = err
  }
}

module.exports = {
  SessionError,
  SessionNotFound,
  SessionForbidden,
  SessionNotStarted,
  TranscriberUnavailable,
}
