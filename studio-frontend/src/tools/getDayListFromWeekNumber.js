export default function getDayListFromWeekNumber(weekNumber, year) {
  const firstMondayOfYear = getFirstMondayOfYear(year)

  const firstDayOfTheWeek = incrementByNDays(
    firstMondayOfYear,
    7 * (weekNumber - 1),
  )

  const dayList = []
  for (let i = 0; i < 7; i++) {
    const day = incrementByNDays(firstDayOfTheWeek, i)
    dayList.push(day)
  }

  return dayList
}

export function getFirstMondayOfYear(year) {
  const firstDayOfYear = new Date(`${year}-01-01`)
  const dayInWeekOfFirstDay = firstDayOfYear.getDay() // 1 is monday, 0 is sunday, 6 is saturday
  let numberOfDayToIncrementUntilMonday = 0
  switch (dayInWeekOfFirstDay) {
    case 0: // sunday
      numberOfDayToIncrementUntilMonday = 1
      break
    case 1: // monday
      numberOfDayToIncrementUntilMonday = 0
      break
    default: // other days
      numberOfDayToIncrementUntilMonday = 8 - dayInWeekOfFirstDay
  }
  // increment the first day of the year with the number of days to reach the first monday
  const firstMondayOfYear = incrementByNDays(
    firstDayOfYear,
    numberOfDayToIncrementUntilMonday,
  )
  return firstMondayOfYear
}

function incrementByNDays(date, n) {
  let newDate = new Date(date)
  newDate.setDate(date.getDate() + n)
  return newDate
}
