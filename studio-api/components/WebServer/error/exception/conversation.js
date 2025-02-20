/****************
 **Conversation***
 *****************/

const ExceptionType = "conversation"

class ConversationError extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Error during the operation"
    if (err) this.err = err
  }
}

class ConversationNoFileUploaded extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationNoFileUploaded"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "No files were uploaded."
    if (err) this.err = err
  }
}

class ConversationURLExtractorError extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationURLExtractorError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "No files were downloaded."
    if (err) this.err = err
  }
}
class ConversationMetadataRequire extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationMetadataRequire"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Metadata was not provided."
    if (err) this.err = err
  }
}

class ConversationUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationUnsupportedMediaType"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = "Parameter is not supported"
    if (err) this.err = err
  }
}

class ConversationWriteAccessDenied extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationWriteAccessDenied"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = `User don't have write access to the conversation`
    if (err) this.err = err
  }
}

class ConversationShareAccessDenied extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationShareAccessDenied"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = `User don't have share access to the conversation`
    if (err) this.err = err
  }
}

class ConversationDeleteAccessDenied extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationDeleteAccessDenied"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = `User don't have delete access to the conversation`
    if (err) this.err = err
  }
}

class ConversationReadAccessDenied extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationReadAccessDenied"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = `User don't have read access to the conversation`
    if (err) this.err = err
  }
}
class ConversationNotShared extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationNotShared"
    this.type = ExceptionType
    this.status = 401
    if (message) this.message = message
    else this.message = `User don't have access to the conversation`
    if (err) this.err = err
  }
}

class ConversationIdRequire extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationIdRequire"
    this.type = ExceptionType
    this.status = 403
    if (message) this.message = message
    else this.message = `Conversation id param is require`
    if (err) this.err = err
  }
}

class ConversationNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "ConversationNotFound"
    this.type = ExceptionType
    this.status = 404
    if (message) this.message = message
    else this.message = "Requested conversation not found"
    if (err) this.err = err
  }
}

/******************************
 ******Conversation Turn*******
 ******************************/

const ExceptionTurnType = ExceptionType + "Turn"

class TurnIdRequire extends Error {
  constructor(message, err) {
    super()
    this.name = "TurnIdRequire"
    this.type = ExceptionTurnType
    this.status = 403
    if (message) this.message = message
    else this.message = "Turn id param is require"
    if (err) this.err = err
  }
}

class TurnNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "TurnNotFound"
    this.type = ExceptionTurnType
    this.status = 404
    if (message) this.message = message
    else this.message = "Requested turn not found"
    if (err) this.err = err
  }
}

/******************************
 **********Subtitle************
 ******************************/

class SubtitleError extends Error {
  constructor(message, err) {
    super()
    this.name = "SubtitleError"
    this.type = ExceptionType
    this.status = 400
    if (message) this.message = message
    else this.message = "Error during the operation"
    if (err) this.err = err
  }
}

class SubtitleUnsupportedMediaType extends Error {
  constructor(message, err) {
    super()
    this.name = "SubtitleUnsupportedMediaType"
    this.type = ExceptionType
    this.status = 415
    if (message) this.message = message
    else this.message = "Parameter is not supported"
    if (err) this.err = err
  }
}

class SubtitleMaxVersion extends Error {
  constructor(message, err) {
    super()
    this.name = "SubtitleMaxVersion"
    this.type = ExceptionType
    this.status = 403
    if (message) this.message = message
    else
      this.message =
        "The number of subtitle versions for that conversion has reached its limit."
    if (err) this.err = err
  }
}

class SubtitleNotFound extends Error {
  constructor(message, err) {
    super()
    this.name = "SubtitleNotFound"
    this.type = ExceptionType
    this.status = 404
    if (message) this.message = message
    else this.message = "Requested subtitle not found"
    if (err) this.err = err
  }
}

module.exports = {
  ConversationNoFileUploaded,
  ConversationURLExtractorError,
  ConversationMetadataRequire,
  ConversationUnsupportedMediaType,
  ConversationReadAccessDenied,
  ConversationWriteAccessDenied,
  ConversationDeleteAccessDenied,
  ConversationShareAccessDenied,
  ConversationNotShared,
  ConversationIdRequire,
  ConversationError,
  ConversationNotFound,
  TurnIdRequire,
  TurnNotFound,
  SubtitleUnsupportedMediaType,
  SubtitleError,
  SubtitleMaxVersion,
  SubtitleNotFound,
}
