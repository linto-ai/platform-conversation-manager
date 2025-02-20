const debug = require("debug")(
  "linto:components:WebServer:controller:filterRules:segmentCharResize",
)

module.exports = function (segments, segmentCharResize) {
  if (!segments || segments.length === 0) return segments

  let segment_resized = []
  for (let segment of segments) {
    const segment_to_splice = Math.ceil(
      segment.segment.length / segmentCharResize,
    )
    let last_word_added = -1
    let is_last_word_added = false

    if (segment_to_splice <= 0)
      segment_resized.push(segment) // No need to resize
    else {
      for (let j = 0; j < segment_to_splice; j++) {
        if (is_last_word_added) break

        let words = []
        let segment_size = 0
        for (let k = last_word_added + 1; k < segment.words.length; k++) {
          if (segment_size <= segmentCharResize || segment_size === 0) {
            last_word_added = k

            if (last_word_added === segment.words.length - 1)
              is_last_word_added = true

            words.push(segment.words[k])
            segment_size += segment.words[k].word.length
          } else break
        }

        // check if few x words contains some punctuation
        let extra_words_check =
          Math.ceil(segmentCharResize * 0.2) + last_word_added
        if (!is_last_word_added) {
          if (extra_words_check > segment.words.length)
            extra_words_check = segment.words.length

          let tmp_extra_words = []
          let add_extra = false
          for (let k = last_word_added + 1; k < extra_words_check; k++) {
            tmp_extra_words.push(segment.words[k])
            if (/[.,!?;:]$/.test(segment.words[k].word)) {
              add_extra = true
              last_word_added = k
              break
            }
          }
          if (add_extra) words.push(...tmp_extra_words)
        }

        const first_start_word = words[0].start
        const last_end_word = words[words.length - 1].end

        let raw_words = segment.raw_words.filter(
          (word) => word.start >= first_start_word && word.end <= last_end_word,
        )
        if (is_last_word_added) {
          // if last segment words added, add all the remaining raw words
          let missed_raw_words = segment.raw_words.filter(
            (word) => word.start >= last_end_word,
          )
          raw_words.push(...missed_raw_words)
        }

        let new_segment = {
          ...segment,
          words: words,
          segment: words.map((word) => word.word).join(" "),
          raw_segment: raw_words.map((word) => word.word).join(" "),
          start: first_start_word,
          end: last_end_word,
          duration: last_end_word - first_start_word,
        }
        delete new_segment.raw_words
        segment_resized.push(new_segment)
      }
    }
  }
  return segment_resized
}
