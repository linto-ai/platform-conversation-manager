const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:controller:conversation:utility",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const CONVERSATION_RIGHTS = require(
  `${process.cwd()}/lib/dao/conversation/rights`,
)
const ORGANIZATION_ROLES = require(
  `${process.cwd()}/lib/dao/organization/roles`,
)

const { ConversationError } = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)
const { OrganizationNotFound } = require(
  `${process.cwd()}/components/WebServer/error/exception/organization`,
)

const fs = require("fs")
const mm = require("music-metadata")

const conversation_projection = [
  "_id",
  "name",
  "description",
  "owner",
  "organization",
  "metadata",
  "locale",
  "jobs",
  "created",
  "sharedWithUsers",
  "last_update",
  "tags",
]

async function userAccess(
  userId,
  convId,
  desiredRole = ORGANIZATION_ROLES.MAINTAINER,
) {
  try {
    let conversation = await model.conversations.getById(
      convId,
      conversation_projection,
    )
    if (conversation.length !== 1)
      throw new ConversationError("Conversation not found")
    conversation = conversation[0]

    if (
      conversation.sharedWithUsers.filter(
        (user) =>
          user.userId === userId &&
          CONVERSATION_RIGHTS.hasRightAccess(
            user.right,
            CONVERSATION_RIGHTS.READ,
          ),
      ).length !== 0
    ) {
      return conversation
    }

    const orga = await model.organizations.getById(
      conversation.organization.organizationId,
    )
    if (orga.length !== 1)
      throw new OrganizationNotFound("Organization not found")

    const user = orga[0].users.filter((user) => user.userId === userId)
    if (user.length !== 1) return undefined

    for (let customRight of conversation.organization.customRights) {
      if (
        customRight.userId === userId &&
        CONVERSATION_RIGHTS.hasRightAccess(
          customRight.right,
          CONVERSATION_RIGHTS.READ,
        )
      )
        return conversation
      else if (customRight.userId === userId) return undefined
    }

    if (ORGANIZATION_ROLES.hasRoleAccess(user[0].role, desiredRole))
      return conversation
    else return undefined
  } catch (err) {
    throw err
  }
}

async function getUserConversation(userId) {
  try {
    const convList = []
    const convShare = await model.conversations.getByShare(userId)
    for (let conversation of convShare) {
      // User may have a right to see the conversation from sharedWithUsers
      if (
        conversation.sharedWithUsers.filter(
          (user) =>
            user.userId === userId &&
            CONVERSATION_RIGHTS.hasRightAccess(
              user.right,
              CONVERSATION_RIGHTS.READ,
            ),
        ).length !== 0
      ) {
        convList.push(conversation)
      }
    }

    const userOrga = await model.organizations.listSelf(userId)
    for (let orga of userOrga) {
      const convOrga = await model.conversations.getByOrga(orga._id)

      const userRole = orga.users.filter((user) => user.userId === userId)
      for (let conversation of convOrga) {
        if (
          ORGANIZATION_ROLES.hasRoleAccess(
            userRole[0].role,
            ORGANIZATION_ROLES.MAINTAINER,
          )
        ) {
          convList.push(conversation)
        } else if (
          CONVERSATION_RIGHTS.hasRightAccess(
            conversation.organization.membersRight,
            CONVERSATION_RIGHTS.READ,
          )
        ) {
          convList.push(conversation)
        } else {
          conversation.organization.customRights.map((orgaUser) => {
            if (
              orgaUser.userId === userId &&
              CONVERSATION_RIGHTS.hasRightAccess(
                orgaUser.right,
                CONVERSATION_RIGHTS.READ,
              )
            )
              convList.push(conversation)
          })
        }
      }
    }

    return convList
  } catch (err) {
    throw new ConversationError(err)
  }
}

async function getUserRightFromConversation(userId, conversation) {
  try {
    const orgaId = conversation.organization.organizationId
    const organization = await model.organizations.getById(orgaId)
    if (organization.length !== 1) throw new OrganizationNotFound()

    const orgaRole = organization[0].users.filter(
      (user) => user.userId === userId,
    )[0]

    let access = {
      role: orgaRole ? orgaRole.role : 0,
      right: conversation.organization.membersRight,
    }

    if (
      ORGANIZATION_ROLES.hasRoleAccess(access.role, ORGANIZATION_ROLES.ADMIN)
    ) {
      access.right = CONVERSATION_RIGHTS.adminRight()
    } else if (
      ORGANIZATION_ROLES.hasRoleAccess(
        access.role,
        ORGANIZATION_ROLES.MAINTAINER,
      )
    ) {
      access.right = CONVERSATION_RIGHTS.maintainerRight()
    } else if (
      ORGANIZATION_ROLES.hasRoleAccess(
        access.role,
        ORGANIZATION_ROLES.MEMBER,
      ) ||
      ORGANIZATION_ROLES.hasRoleAccess(access.role, ORGANIZATION_ROLES.UPLOADER)
    ) {
      const organizationRight = conversation.organization.customRights.filter(
        (user) => user.userId === userId,
      )[0]
      if (organizationRight) access.right = organizationRight.right
    } else {
      const conversationRight = conversation.sharedWithUsers.filter(
        (user) => user.userId === userId,
      )[0]
      if (conversationRight) access.right = parseInt(conversationRight.right)
    }

    return access
  } catch (err) {
    throw err
  }
}

async function getUserRightFromConversationList(userId, conversations) {
  for (let conv of conversations) {
    const data = await getUserRightFromConversation(userId, conv)
    conv.userAccess = data
  }
  return conversations
}

async function getUserRightByShare(userId, conversations) {
  for (let conv of conversations) {
    let data = {}
    const conversationRight = conv.sharedWithUsers.filter(
      (user) => user.userId === userId,
    )[0]
    if (conversationRight) data.right = parseInt(conversationRight.right)
    conv.userAccess = data
  }
  return conversations
}

async function textInConversation(text, conversationId) {
  const conversation = (await model.conversations.getById(conversationId))[0]
  for (const turn of conversation.text) {
    if (turn.raw_segment.toLowerCase().includes(text.toLowerCase())) {
      return true
    }
  }
  return false
}

async function generateAudioDuration(conversation) {
  const filePath = `${process.cwd()}/${process.env.VOLUME_FOLDER}/${conversation.metadata.audio.filepath}`
  if (fs.existsSync(filePath)) {
    const file_metadata = await mm.parseStream(fs.createReadStream(filePath), {
      mimeType: "audio/mpeg",
    })
    conversation.metadata.audio.duration = file_metadata.format.duration
    await model.conversations.update({
      _id: conversation._id,
      metadata: conversation.metadata,
    })
  }
  return conversation
}

module.exports = {
  userAccess,
  getUserConversation,
  getUserRightFromConversation,
  getUserRightFromConversationList,
  getUserRightByShare,
  textInConversation,
  generateAudioDuration,
}
