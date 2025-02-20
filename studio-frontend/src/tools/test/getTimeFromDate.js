import test from "ava"
import getTimeFromDate from "../getTimeFromDate.js"

test("getTimeFromDate", (t) => {
  let date = new Date("2024-10-04 12:34")
  t.deepEqual(getTimeFromDate(date), "12:34")
  date = new Date("2024-03-04 01:02")
  t.deepEqual(getTimeFromDate(date), "01:02")
})
