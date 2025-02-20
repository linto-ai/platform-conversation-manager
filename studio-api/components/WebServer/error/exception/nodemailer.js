/****************
 ** nodemailer ***
 *****************/

const ExceptionType = "nodemailer"

class NodemailerError extends Error {
  constructor(message, err) {
    super()
    this.name = "NodemailerError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else
      this.message =
        "An error has occured when sending email. Please retry later or contact support."
    if (err) this.err = err
  }
}

class NodemailerInvalidEmail extends Error {
  constructor(message, err) {
    super()
    this.name = "NodemailerInvalidEmail"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "The email address is invalid or have a bad domain."
    if (err) this.err = err
  }
}
module.exports = {
  NodemailerError,
  NodemailerInvalidEmail,
}
