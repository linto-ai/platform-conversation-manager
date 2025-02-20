import test from "ava"
import getWeekNumberFromDate from "../getWeekNumberFromDate.js"

test("get week number from date", (t) => {
  const date = new Date("2021-01-01")
  const weekNumber = getWeekNumberFromDate(date)
  t.is(weekNumber, 53)

  const date2 = new Date("2023-01-02")
  const weekNumber2 = getWeekNumberFromDate(date2)
  t.is(weekNumber2, 1)

  const date3 = new Date("2023-01-06")
  const weekNumber3 = getWeekNumberFromDate(date3)
  t.is(weekNumber3, 1)
})
