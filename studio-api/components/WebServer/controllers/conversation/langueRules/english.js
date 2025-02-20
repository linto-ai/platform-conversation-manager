const debug = require("debug")(
  "linto:components:WebServer:controller:langueRules:french",
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

function doublePunctuation(seg_text, words, loop_data) {
  if (/[?!:;«»–—]$/.test(seg_text.lowercase)) {
    let timestamp = 0

    if (loop_data.last_endtime !== undefined) timestamp = loop_data.last_endtime
    else if (loop_data.word_index !== 0)
      timestamp = loop_data.words[loop_data.word_index - 1].start

    //count number if space in the segment
    let spacesCount = (seg_text.lowercase.match(/ /g) || []).length

    if (/[0-9a-zA-ZÀ-ÿ]/.test(seg_text.lowercase)) skip_words = spacesCount
    else skip_words = -1

    return {
      start: timestamp,
      end: timestamp,
      word: seg_text.original,
      conf: 1,
      skip_words: skip_words,
    }
  }
}

function apostropheNormalize(seg_text, words, loop_data) {
  if (
    seg_text.lowercase.includes("'") &&
    seg_text.lowercase.includes(words.word)
  ) {
    return {
      ...words,
      word: seg_text.original,
      end: loop_data.words[loop_data.word_index].end,
      conf: (words.conf + loop_data.words[loop_data.word_index].conf) / 2,
      skip_words: seg_text.original.split("'").length - 1, // Sometime we have multiple ', same rule apply x time
    }
  }
}

function notFound(segment_text, words) {
  return words
}

//Should only be trigger on special case and last word
function lastWord(segment_text, words, loop_data) {
  // In case of last word is a double punctuation,
  // It can be desync with the words array depending of the transcription services
  if (
    segment_text.lowercase.length === 1 &&
    /[?!:;«»–—]$/.test(segment_text.lowercase)
  ) {
    let last_word_index = loop_data.words.length - 1

    return {
      ...loop_data.words[last_word_index],
      start: loop_data.words[last_word_index].end,
      word: segment_text.original,
    }
  }
  return undefined
}

module.exports = {
  rules_sequences: [
    correctSegmentText,
    simplePunctuation,
    doublePunctuation,
    apostropheNormalize,
    notFound,
  ],
  rules: [
    correctSegmentText,
    simplePunctuation,
    doublePunctuation,
    apostropheNormalize,
    notFound,
    lastWord,
  ],
}
