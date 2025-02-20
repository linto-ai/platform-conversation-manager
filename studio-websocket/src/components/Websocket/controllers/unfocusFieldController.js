import Conversations from "../models/conversations.js"

export function unfocusField(
  conversationId,
  userId,
  socket,
  userToken,
  selfMsg,
) {
  let conversation = Conversations.getById(conversationId)
  conversation.resetUsers(userId, userToken)

  if (selfMsg) {
    socket.emit("user_focus_field", {
      users: conversation.getUsersList(),
      focusFields: conversation.getFocusFields(),
    })
  }

  socket.to(`conversation/${conversationId}`).emit("user_focus_field", {
    users: conversation.getUsersList(),
    focusFields: conversation.getFocusFields(),
  })
}
