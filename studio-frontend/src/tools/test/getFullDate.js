import test from "ava"
import getFullDate from "../getFullDate.js"

test("getFullDate", (t) => {
  let date = new Date("2024-10-04")
  t.deepEqual(getFullDate(date), "2024-10-04")
  date = new Date("2024-03-04")
  t.deepEqual(getFullDate(date), "2024-03-04")
})
