class ComponentMissingError extends Error {
  constructor(missingComponents) {
    super()
    this.name = "COMPONENT_MISSING"
    this.missingComponents = missingComponents
  }
}

class MailError extends Error {
  constructor(mailError) {
    super()
    this.name = "MAIL_ERROR"
    this.mailError = mailError
  }
}

module.exports = {
  ComponentMissingError,
  MailError,
}
