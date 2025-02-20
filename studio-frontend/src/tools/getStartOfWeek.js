export default function getStartOfWeek(date) {
  let decrement = 0
  switch (date.getDay()) {
    case 0: // sunday
      decrement = 6
      break
    case 1: // monday
      decrement = 0
      break
    default: // other days
      decrement = date.getDay() - 1
  }
  return new Date(date.setDate(date.getDate() - decrement))
}
