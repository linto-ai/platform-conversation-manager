const TYPES = Object.freeze({
  CANONICAL: "canonical",
  CHILD: "child",
  TRANSLATION: "translation",

  // check if the type is valid
  checkValue: (type) =>
    type === TYPES.CANONICAL ||
    type === TYPES.CHILD ||
    type === TYPES.TRANSLATION,
  desiredType: (type) => {
    switch (true) {
      case type === undefined:
        return false
      case type === TYPES.CANONICAL:
      case type === TYPES.CHILD:
      case type === TYPES.TRANSLATION:
        return true
      default:
        return false
    }
  },
})

module.exports = TYPES
