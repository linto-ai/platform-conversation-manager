const debug = require("debug")(
  "linto:components:WebServer:controller:filterRules:segmentWordResize",
)

module.exports = function (segments, segmentWordResize) {
  if (!segments || segments.length === 0) return segments

  let segment_resized = []
  for (let segment of segments) {
    const segment_to_splice = Math.ceil(
      segment.words.length / segmentWordResize,
    )

    if (segment_to_splice <= 0)
      segment_resized.push(segment) // No need to resize
    else {
      for (let j = 0; j < segment_to_splice; j++) {
        let new_words = segment.words.splice(0, segmentWordResize)

        const last_end_word = new_words[new_words.length - 1].end
        const first_start_word = new_words[0].start

        let new_raw_words = segment.raw_words.filter(
          (word) => word.start >= first_start_word && word.end <= last_end_word,
        )

        if (j === segment_to_splice - 1) {
          // if last segment words added, add all the remaining raw words
          let last_missed_words = segment.raw_words.filter(
            (word) => word.start >= last_end_word,
          )
          new_raw_words.push(...last_missed_words)
        }

        let new_segment = {
          ...segment,
          words: new_words,
          segment: new_words.map((word) => word.word).join(" "),
          raw_segment: new_raw_words.map((word) => word.word).join(" "),
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
