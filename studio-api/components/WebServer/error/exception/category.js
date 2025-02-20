/****************
 **Category***
 *****************/

const ExceptionType = "category"
class CategoryTypeNotDefined extends Error {
  constructor(message, err) {
    super()
    this.name = "CategoryTypeNotDefined"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = `Category type is not defined`
    if (err) this.err = err
  }
}

class CategoryTypeNotValid extends Error {
  constructor(message, err) {
    super()
    this.name = "CategoryTypeNotValid"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = `Category type is not valid`
    if (err) this.err = err
  }
}

class CategoryError extends Error {
  constructor(message, err) {
    super()
    this.name = "CategoryError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = `Category error`
    if (err) this.err = err
  }
}

class CategoryConflict extends Error {
  constructor(message, err) {
    super()
    this.name = "CategoryConflict"
    this.type = ExceptionType
    this.status = 409
    if (message) this.message = message
    else this.message = `Category conflict`
    if (err) this.err = err
  }
}

class CategoryUnsupportedMediaTypepeNotDefined extends Error {
  constructor(message, err) {
    super()
    this.name = "CategoryUnsupportedMediaTypepeNotDefined"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = `Category unsupported media type`
    if (err) this.err = err
  }
}

class CategoryNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "CategoryNotFound"
    this.type = ExceptionType
    this.status = 404
    if (message) this.message = message
    else this.message = `Category not found`
    if (err) this.err = err
  }
}

module.exports = {
  CategoryUnsupportedMediaTypepeNotDefined,
  CategoryTypeNotDefined,
  CategoryTypeNotValid,
  CategoryConflict,
  CategoryNotFound,
  CategoryError,
}
