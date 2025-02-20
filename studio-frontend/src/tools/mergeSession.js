export default function mergeSession(oldSession, updatedSession) {
  const mergedChannels = oldSession.channels
    ? mergeChannels(oldSession, updatedSession)
    : []

  return { ...oldSession, ...updatedSession, channels: mergedChannels }
}

function mergeChannels(oldSession, updatedSession) {
  if (!updatedSession.channels || updatedSession.channels.length == 0) {
    return oldSession.channels
  }
  // index by id
  const newChannelsIndexedById = {}
  for (const channel of updatedSession.channels) {
    newChannelsIndexedById[channel.id] = channel
  }

  return oldSession.channels.map((channel) => {
    if (newChannelsIndexedById[channel.id]) {
      return { ...channel, ...newChannelsIndexedById[channel.id] }
    } else {
      return channel
    }
  })
}
