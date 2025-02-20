const debug = require("debug")(
  "linto:components:WebServer:controller:langueRules:ruleless",
)

function correctSegmentText(seg_text) {
  let fixed_segment_text = seg_text.original

  fixed_segment_text = fixed_segment_text.replace(",'", "'").replace(",-", "-")

  return {
    original: fixed_segment_text,
    lowercase: fixed_segment_text.replace(/[,.]$/, "").toLowerCase(),
  }
}

function simplePunctuation(seg_text, words, loop_data) {
  if (seg_text.lowercase.replace(/[.,…"]/g, "") === words.word.toLowerCase()) {
    return {
      ...words,
      word: seg_text.original,
    }
  }
}

function notFound(segment_text, words) {
  return words
}

module.exports = {
  rules_sequences: [correctSegmentText, simplePunctuation, notFound],
  rules: [correctSegmentText, simplePunctuation, notFound],
}
