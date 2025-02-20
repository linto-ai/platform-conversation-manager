const JOBS = Object.freeze({
  TRANSCRIPTION: "transcription",
  KEYWORD: "keyword",

  // check if the type is valid
  checkValue: (job) => job === JOBS.TRANSCRIPTION || job === JOBS.KEYWORD,
  desiredType: (job) => {
    switch (true) {
      case job === undefined:
        return false
      case job === JOBS.TRANSCRIPTION:
      case job === JOBS.KEYWORD:
        return true
      default:
        return false
    }
  },
})

module.exports = JOBS
