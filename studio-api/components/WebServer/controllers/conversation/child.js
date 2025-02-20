const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:controller:conversation:child",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

async function updateChildConversation(conversation, action = update) {
  try {
    for (const conversationId of conversation.type.child_conversations) {
      if (action === "DELETE") {
        const child_conv = await model.conversations.getById(conversationId)
        if (!child_conv) continue
        if (child_conv && child_conv[0].type.child_conversations.length > 0) {
          await updateChildConversation(child_conv[0], action)
        }
        await model.conversations.delete(conversationId)
      } else if (action === "RIGHTS") {
        let updateConv = {
          _id: conversationId,
          sharedWithUsers: conversation.sharedWithUsers,
          organization: conversation.organization,
        }
        await model.conversations.update(updateConv)
      }
    }
  } catch (err) {
    throw err
  }
}

module.exports = {
  updateChildConversation,
}
