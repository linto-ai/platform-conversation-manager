const debug = require("debug")(
  "linto:components:WebServer:controller:filterRules",
)

const segmentWordResize = require("./segmentWordResize")
const segmentCharResize = require("./segmentCharResize")

function executeFilterRule(segments, filter) {
  let segment_filtered = []

  try {
    if (filter.segmentWordSize) {
      segment_filtered = segmentWordResize(segments, filter.segmentWordSize)
    }
    if (filter.segmentCharSize) {
      segment_filtered = segmentCharResize(segments, filter.segmentCharSize)
    }

    return segment_filtered
  } catch (err) {
    console.error(err)
    return segments
  }
}

module.exports = {
  executeFilterRule,
}
