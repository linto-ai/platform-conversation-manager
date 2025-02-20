import findInSegment from "../findInSegment.js"
import test from "ava"

test("find multiple expressions", (t) => {
  let search = "llo wo"
  let wordsList = ["hello", "world", "hello", "world", "bye", "world"]
  let rangesList = findInSegment(wordsList, search)
  t.deepEqual(rangesList, [
    { start: 0, end: 1 },
    { start: 2, end: 3 },
  ])
})
