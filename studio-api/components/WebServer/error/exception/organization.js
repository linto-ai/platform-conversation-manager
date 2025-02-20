/****************
 *****Organization*******
 *****************/

const ExceptionType = "organization"

class OrganizationError extends Error {
  constructor(message, err) {
    super()
    this.name = "OrganizationError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Error during the operation"
    if (err) this.err = err
  }
}

class OrganizationForbidden extends Error {
  constructor(message, err) {
    super()
    this.name = "OrganizationForbidden"
    this.type = ExceptionType
    this.status = 403
    if (message) this.message = message
    else this.message = "Not allowed to do this"
    if (err) this.err = err
  }
}

class OrganizationNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "OrganizationNotFound"
    this.type = ExceptionType
    this.status = 404
    if (message) this.message = message
    else this.message = "Organization not found"
    if (err) this.err = err
  }
}

class OrganizationConflict extends Error {
  constructor(message, err) {
    super()
    this.name = "OrganizationConflict"
    this.type = ExceptionType
    this.status = 409
    if (message) this.message = message
    else this.message = "Organization already exists"
    if (err) this.err = err
  }
}

class OrganizationUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "OrganizationUnsupportedMediaType"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = "Parameter is not supported"
    if (err) this.err = err
  }
}

module.exports = {
  OrganizationError,
  OrganizationForbidden,
  OrganizationNotFound,
  OrganizationConflict,
  OrganizationUnsupportedMediaType,
}
