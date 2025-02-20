import test from "ava"
import getStartOfWeek from "../getStartOfWeek.js"

test("getStartOfWeek", (t) => {
  const monday = new Date("2024-10-07")
  t.deepEqual(getStartOfWeek(monday), new Date("2024-10-07"))

  const sunday = new Date("2024-10-06")
  t.deepEqual(getStartOfWeek(sunday), new Date("2024-09-30"))

  const tuesday = new Date("2024-10-08")
  t.deepEqual(getStartOfWeek(tuesday), new Date("2024-10-07"))
})
