import Debug from "debug"

const debug = Debug("Websocket:debug:jobTranscriptionController")

export default async function jobTranscriptionController(
  conversation,
  conversationId,
  userToken,
  io,
) {
  const room = `conversation/${conversationId}`
  const job = conversation.jobs["transcription"]
  if (job.state && (job.state === "done" || job.state === "error")) {
    debug("Job done")
  } else {
    await job.fetchJob(userToken)
    setTimeout(
      () =>
        jobTranscriptionController(conversation, conversationId, userToken, io),
      3000,
    )
    io.to(room).emit("job_transcription_update", {
      ...conversation.jobs["transcription"].toJSON(),
    })
  }
}
