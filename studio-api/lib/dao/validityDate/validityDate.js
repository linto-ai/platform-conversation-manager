const moment = require("moment")

const VALIDITY_DATE = Object.freeze({
  SHORT: { time: 30, period: "m" },
  LONG: { time: 2, period: "d" },
  generateValidityDate: (vDate) =>
    moment().add(vDate.time, vDate.period).format(),
})

module.exports = VALIDITY_DATE
