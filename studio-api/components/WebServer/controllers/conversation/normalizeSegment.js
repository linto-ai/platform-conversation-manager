const debug = require("debug")(
  "linto:components:WebServer:controller:segment_normalize",
)

const rules = require("./langueRules/index")
const filterRules = require("./filterRules/index")

function* ruleSequenceGenerator(segments, lang) {
  let i = 0
  let word_skip_count = 0
  try {
    let loop_data = {
      segment: segments.segment_array,
      words: segments.raw_words,
      segment_index: 0,
      word_index: 0,
    }

    while (i < segments.segment_array.length) {
      let j = i + word_skip_count + 1 //  index of words

      loop_data.segment_index = i
      loop_data.word_index = j

      let segment_text = {
        original: segments.segment_array[i],
        lowercase: segments.segment_array[i].toLowerCase(),
      }

      if (segments.raw_words[j - 1] !== undefined) {
        let seg_words = rules.executeLangRule(
          lang,
          segment_text,
          segments.raw_words[j - 1],
          loop_data,
        )

        if (seg_words?.skip_words) {
          word_skip_count += seg_words.skip_words
          delete seg_words.skip_words
        }

        if (Array.isArray(seg_words)) {
          i = seg_words[0].go_to_segment
          word_skip_count += seg_words[0].skip_words
          let segment_done = false // Allow to dodge an overlap for some end segment when number are in a row

          for (let word of seg_words) {
            if (word.segment_done) segment_done = true

            delete word.go_to_segment
            delete word.segment_done
            delete word.skip_words
            loop_data.last_endtime = word.end
            yield word
          }
          if (segment_done) break
        } else {
          yield seg_words
          loop_data.last_endtime = seg_words.end
        }
      } else if (segment_text !== undefined) {
        // Still one last word, can have a desync with raw_words
        let last_word = rules.executeRulesByName(
          lang,
          "lastWord",
          segment_text,
          undefined,
          loop_data,
        )
        if (last_word !== undefined) yield last_word
      }
      i++
    }
  } catch (error) {
    console.log(error)
  }
}

function cleanSegment(segment) {
  return segment.replace(" ', ", "'").replace(/' /g, "'")
}

function segmentNormalizeText(transcription, lang, filter = undefined) {
  if (transcription === undefined) throw new Error("Transcription was empty")
  else if (lang === undefined) throw new Error("Langue was empty")

  for (let seg of transcription.segments) {
    seg.segment = cleanSegment(seg.segment)
  }

  transcription.segments.map((segments) => {
    segments.raw_words = [...segments.words]
    segments.words = []

    // Removing space after an apostrophe from a LinSTT transcription service
    segments.segment_array = segments.segment.split(" ")

    if (segments.language) lang = segments.language

    if (segments.segment_array.length > 0 && segments.segment_array[0] === "") {
      segments.segment_array.shift()
    }

    for (let words_sequence of ruleSequenceGenerator(segments, lang, filter)) {
      segments.words.push(words_sequence)
    }
    delete segments.segment_array
  })

  if (filter && Object.keys(filter).length > 0) {
    let filtered_transcription = transcription

    let filtered_segment = filterRules.executeFilterRule(
      filtered_transcription.segments,
      filter,
    )
    filtered_transcription.segments = filtered_segment

    return filtered_transcription
  }
  return transcription
}

module.exports = {
  segmentNormalizeText,
}
