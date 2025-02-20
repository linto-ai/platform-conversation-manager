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

// Reduced word j.c. need to be compared to j.c and not jc
function diminutivePunctuation(seg_text, words, loop_data) {
  if (seg_text.lowercase.replace(/\.$/, "") === words.word.toLowerCase()) {
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

function numberNormalize(seg_text, words, loop_data) {
  const regex_number = /.*[0-9].*/
  if (regex_number.test(seg_text.lowercase.replace(/[,.:]$/, ""))) {
    if (loop_data.segment_index + 1 > loop_data.segment.length - 1) {
      // in case of last word
      return {
        ...words,
        word: seg_text.original,
      }
    }

    let seg_number = []
    let number_in_a_row_find = 0
    let end_segment = false
    while (
      loop_data.segment_index + number_in_a_row_find <
      loop_data.segment.length
    ) {
      if (
        regex_number.test(
          loop_data.segment[
            loop_data.segment_index + number_in_a_row_find
          ].replace(/[,.:]$/, ""),
        )
      ) {
        if (
          loop_data.segment[
            loop_data.segment_index + number_in_a_row_find + 1
          ] === undefined
        )
          // If the last number find don't have any word after
          end_segment = true

        seg_number.push(
          loop_data.segment[loop_data.segment_index + number_in_a_row_find],
        )
        number_in_a_row_find++
      } else break
    }

    if (
      number_in_a_row_find > 1 &&
      loop_data.segment[loop_data.segment_index + number_in_a_row_find] ===
        undefined
    ) {
      number_in_a_row_find = number_in_a_row_find - 1
    } else if (
      !loop_data.segment[loop_data.segment_index + number_in_a_row_find]
    )
      // No next word, exit
      return
    let next_word_seg = correctSegmentText({
      original:
        loop_data.segment[loop_data.segment_index + number_in_a_row_find],
    })

    // Special case if the next word after the number is an apostrophe because of the linstt transcription
    // Should not be case with the whisper transcription
    if (next_word_seg.lowercase.includes("'")) {
      next_word_seg.fixed = next_word_seg.lowercase.split("'")[0] + "'"
    }

    let index = loop_data.word_index
    let confidences_scores = words.conf
    while (index < loop_data.words.length) {
      if (
        next_word_seg.lowercase === loop_data.words[index].word.toLowerCase() || // Break loop, next word is not a number
        (next_word_seg.fixed !== undefined &&
          next_word_seg.fixed === loop_data.words[index].word) || // In can of fixed segment match word
        end_segment // in case of number in row and nothing after, end_segment can't be at false if we have x number in row
      ) {
        // trigger exit loop

        if (number_in_a_row_find > 1) {
          // if multiple number in a row
          let start = words.start
          let diff =
            (loop_data.words[index - 1].end - start) / number_in_a_row_find

          let words_output = []
          for (let num_words of seg_number) {
            words_output.push({
              word: num_words,
              start: start,
              end: start + diff,
              conf: confidences_scores / (number_in_a_row_find + 1),
              go_to_segment: loop_data.segment_index + number_in_a_row_find - 1,
              skip_words:
                index - loop_data.word_index - number_in_a_row_find + 1,
              segment_done: end_segment,
            })
            start += diff
          }
          return words_output
        } else {
          return {
            word: seg_text.original,
            start: words.start,
            end: loop_data.words[index - 1].end,
            conf: confidences_scores / (index + 1 - loop_data.word_index), // total confidence minus number of words
            skip_words: index - loop_data.word_index,
          }
        }
      }
      confidences_scores += loop_data.words[index].conf
      index++
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
    diminutivePunctuation,
    doublePunctuation,
    apostropheNormalize,
    numberNormalize,
    notFound,
  ],
  rules: [
    correctSegmentText,
    simplePunctuation,
    diminutivePunctuation,
    doublePunctuation,
    apostropheNormalize,
    numberNormalize,
    notFound,
    lastWord,
  ],
}
