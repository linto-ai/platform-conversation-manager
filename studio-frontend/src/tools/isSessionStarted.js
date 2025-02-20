export default function isSessionStarted(session) {
  if (!session) {
    return false
  }

  if (session.status === "active") {
    return true
  }

  if (session.status === "ready") {
    if (!session.scheduleOn) {
      return true
    }

    const startTime = new Date(session?.scheduleOn)
    const now = new Date()

    //if (!session.endTime) {
    return startTime < now
    //}

    // const endTime = new Date(session?.endTime)

    // if (startTime < now && endTime > now) {
    //   return true
    // }
  }

  return false
}
