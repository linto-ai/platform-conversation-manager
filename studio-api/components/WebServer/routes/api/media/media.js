const debug = require("debug")(
  "linto:conversation-manager:router:api:file:files",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)
const fs = require("fs")

module.exports = (webserver) => {
  return [
    {
      path: "/conversations/:conversationId/media",
      method: "get",
      requireAuth: true,
      requireConversationReadAccess: true,
      controller: async (req, res, next) => {
        try {
          const conversation = await model.conversations.getById(
            req.params.conversationId,
          )
          if (
            conversation.length === 1 &&
            conversation[0].metadata &&
            conversation[0].metadata.audio &&
            conversation[0].metadata.audio.filepath
          ) {
            const filePath = `${process.cwd()}/${process.env.VOLUME_FOLDER}/${conversation[0].metadata.audio.filepath}`
            if (!fs.existsSync(filePath)) {
              res
                .status(404)
                .send({ message: "Error on fetching the audio file" })
            } else {
              res.setHeader("Content-Type", "audio/mpeg")
              res.sendFile(filePath)
            }
          } else {
            res
              .status(204)
              .send({ message: "Conversation don't have any audio" })
          }
        } catch (err) {
          next(err)
        }
      },
    },
  ]
}
