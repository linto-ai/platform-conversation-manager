const debug = require("debug")(
  "linto:components:WebServer:controller:langueRules",
)

const frFr = require("./french")
const enUs = require("./english")
const ruleless = require("./ruleless")

function selectLang(lang) {
  if (lang !== undefined) {
    const langPrefix = lang.split("-")[0]
    const languageMap = {
      fr: frFr,
      en: enUs,
    }
    return languageMap[langPrefix] || ruleless
  }

  return ruleless
}

function executeLangRule(lang, segment_text, words, loop_data) {
  const functionLangueArr = selectLang(lang).rules_sequences

  // if (!segment_text || !words || !loop_data) return {}

  for (let func of functionLangueArr) {
    let res = {}
    try {
      res = func(segment_text, words, loop_data)
    } catch (err) {
      debug(`rule error on ${func.name}, will add default words\n`, err)
      return words
    }

    // handle different rules
    if (typeof res === "object" && res.original !== undefined) {
      segment_text = res
    } else if (typeof res === "object") {
      return res
    } else if (Array.isArray(res)) {
      return res
    }
  }
}

function executeRulesByName(lang, rule_name, segment_text, words, loop_data) {
  const functionLangueArr = selectLang(lang).rules
  for (let func of functionLangueArr) {
    if (func.name === rule_name) {
      let res = {}
      try {
        res = func(segment_text, words, loop_data)
        if (typeof res === "object" && res.original !== undefined) {
          segment_text = res
        } else if (typeof res === "object") {
          return res
        } else if (Array.isArray(res)) {
          return res
        }
      } catch (err) {
        debug(`rule error on ${func.name}, will add default words\n`, err)
        return undefined
      }
      break
    }
  }
}

module.exports = {
  selectLang,
  executeLangRule,
  executeRulesByName,
}
