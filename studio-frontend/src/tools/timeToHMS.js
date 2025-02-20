export function timeToHMS(
  time,
  { stripZeros = false, stripHourZeros = false, withCentisecond } = {}
) {
  if (time == null) {
    return null
  }

  const hour = Math.floor(time / (60 * 60))
  const min = Math.floor((time %= 3600) / 60)
  const sec = Math.floor(time % 60)
  const cs = Math.floor((time % 1) * 100)

  let res = ""

  stripHourZeros = stripHourZeros || stripZeros
  if (!stripHourZeros || (stripHourZeros && hour > 0)) {
    res += `${hour < 10 ? "0" + hour : hour}:`
  }

  if (!stripZeros || (stripZeros && (min > 0 || hour > 0))) {
    res += `${min < 10 ? "0" + min : min}:`
  }

  res += `${sec < 10 ? "0" + sec : sec}`

  if (withCentisecond) {
    res += `.${cs < 10 ? "0" + cs : cs}`
  }
  return res
}
