const TYPE = Object.freeze({
  HIGHLIGHT: "highlight",
  // "LABEL": 'label',
  LABEL: "conversation_metadata",

  // check if the type is valid
  checkValue: (type) => type === TYPE.HIGHLIGHT || type === TYPE.LABEL,
  desiredType: (type, desiredType) => {
    switch (true) {
      case type === undefined:
        return false
      case desiredType === undefined:
        return true
      case type === TYPE.HIGHLIGHT && desiredType.includes(TYPE.HIGHLIGHT):
        return true
      case type === TYPE.LABEL && desiredType.includes(TYPE.LABEL):
        return true
      default:
        return false
    }
  },
})

module.exports = TYPE
