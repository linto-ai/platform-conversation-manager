import { updateUserRightInConversation } from "../request/index.js"

export default async function updateUserRightsController(data) {
  try {
    const origin = new URL(this.request.headers.origin)

    let update = await updateUserRightInConversation(
      data.conversationId,
      data.userId,
      data.right,
      data.userToken,
      {
        "x-forwarded-host": origin.host,
        "x-forwarded-proto": origin.protocol.replace(":", ""),
      },
    )

    let room = `conversation/${data.conversationId}`
    if (update.status === "success") {
      // Broadcast updates on the room
      this.broadcast.to(room).emit("user_right_updated", {
        origin: data.origin,
        value: {
          userId: data.userId,
          right: data.right,
        },
      })
      this.emit("user_right_updated", {
        origin: data.origin,
        value: {
          userId: data.userId,
          right: data.right,
        },
      })
    } else throw "Update failed"
  } catch (error) {
    console.error(error)
  }
}
