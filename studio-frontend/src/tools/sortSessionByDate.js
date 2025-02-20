export default function sortSessionByDate(s1, s2) {
  const firstStartDate = new Date(s2.startTime)

  const secondStartDate = new Date(s1.startTime)

  if (firstStartDate < secondStartDate) {
    return -1
  }

  if (firstStartDate > secondStartDate) {
    return 1
  }

  const firstScheduleStartDate = new Date(s2.scheduleOn)
  const secondScheduleStartDate = new Date(s1.scheduleOn)

  if (firstScheduleStartDate < secondScheduleStartDate) {
    return -1
  }

  if (firstScheduleStartDate > secondScheduleStartDate) {
    return 1
  }

  const firstCreationDate = new Date(s2.createdAt)
  const secondCreationDate = new Date(s1.createdAt)

  if (firstCreationDate < secondCreationDate) {
    return -1
  }

  if (firstCreationDate > secondCreationDate) {
    return 1
  }
}
