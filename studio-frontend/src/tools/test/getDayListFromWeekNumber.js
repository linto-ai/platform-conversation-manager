import test from "ava"
import getDayListFromWeekNumber from "../getDayListFromWeekNumber.js"
import { getFirstMondayOfYear } from "../getDayListFromWeekNumber.js"
test("get day list from week number", (t) => {
  const dayList = getDayListFromWeekNumber(1, 2021)
  t.deepEqual(dayList, [
    new Date("2021-01-04"),
    new Date("2021-01-05"),
    new Date("2021-01-06"),
    new Date("2021-01-07"),
    new Date("2021-01-08"),
    new Date("2021-01-09"),
    new Date("2021-01-10"),
  ])
})

test("get first monday of year", (t) => {
  const firstMondayOfYear = getFirstMondayOfYear(2021)
  t.deepEqual(firstMondayOfYear, new Date("2021-01-04"))
})
