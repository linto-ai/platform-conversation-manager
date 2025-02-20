const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:controller:user:utility",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const CONVERSATION_RIGHTS = require(
  `${process.cwd()}/lib/dao/conversation/rights`,
)

const { getStorageFolder, deleteFile } = require(
  `${process.cwd()}/components/WebServer/controllers/files/store`,
)

const orgaUtility = require(
  `${process.cwd()}/components/WebServer/controllers/organization/utility`,
)

async function getUsersListByConversation(userId, conversation, organiaztion) {
  try {
    let isShare = false
    let sharedUser = undefined

    let external_members = []
    let organization_members = []

    for (const swUser of conversation.sharedWithUsers) {
      if (swUser.userId === userId) {
        isShare = true
        sharedUser = swUser
      }
    }

    for (const swUser of conversation.sharedWithUsers) {
      let user = await model.users.getById(swUser.userId)
      if (user.length !== 1) {
        console.log("User not found", swUser.userId)
      } else {
        if (
          isShare &&
          (!user.private ||
            CONVERSATION_RIGHTS.hasRightAccess(
              sharedUser.right,
              CONVERSATION_RIGHTS.SHARE,
            ))
        ) {
          external_members.push({ ...user[0], role: 0, right: swUser.right })
        } else if (!isShare) {
          external_members.push({ ...user[0], role: 0, right: swUser.right })
        }
      }
    }

    for (const oUser of organiaztion.users) {
      let user = await model.users.getById(oUser.userId)
      if (user.length !== 1) {
        console.log("User not found", oUser.userId)
      } else {
        if (
          isShare &&
          CONVERSATION_RIGHTS.hasRightAccess(
            sharedUser.right,
            CONVERSATION_RIGHTS.SHARE,
          )
        ) {
          organization_members.push({
            ...user[0],
            role: oUser.role,
            right: CONVERSATION_RIGHTS.setRight(
              oUser.role,
              conversation.organization.membersRight,
            ),
          })
        } else if (!isShare) {
          organization_members.push({
            ...user[0],
            role: oUser.role,
            right: CONVERSATION_RIGHTS.setRight(
              oUser.role,
              conversation.organization.membersRight,
            ),
          })
        }
      }
    }

    for (const oUser of conversation.organization.customRights) {
      let orgaUser = organization_members.find(
        (u) => u._id.toString() === oUser.userId,
      )
      if (orgaUser) orgaUser.right = oUser.right
    }

    return {
      external_members,
      organization_members,
    }
  } catch (error) {
    console.error(error)
    return error
  }
}

async function removeUserFromPlatform(userId) {
  try {
    // Get all conversations shared with the user
    const conversations = await model.conversations.getByShare(userId)

    // Remove the user from the sharedWithUsers array
    conversations.map(async (conversation) => {
      conversation.sharedWithUsers = conversation.sharedWithUsers.filter(
        (user) => user.userId !== userId,
      )

      // Update the conversation
      const resultConvoUpdate = await model.conversations.update(conversation)
      if (resultConvoUpdate.matchedCount === 0) throw new UserError()
    })

    // Get all organizations the user is part of

    const organizations = await model.organizations.listSelf(userId)
    organizations.map(async (organization) => {
      const data = orgaUtility.countAdmin(organization, userId)
      if (data.adminCount === 1 && data.isAdmin) {
        const conversations = await model.conversations.getByOrga(
          organization._id,
        )
        conversations.map(async (conversation) => {
          deleteFile(
            `${getStorageFolder()}/${conversation.metadata.audio.filepath}`,
          )

          const resultConvo = await model.conversations.delete(conversation._id)
          if (resultConvo.deletedCount !== 1) throw new UserError()
        })
        // delete orga
        const resultOrga = await model.organizations.delete(organization._id)
        if (resultOrga.deletedCount !== 1) throw new UserError()
      } else if (data.adminCount > 1 || !data.isAdmin) {
        organization.users = organization.users.filter(
          (user) => user.userId !== userId,
        )
        let resultOperation = await model.organizations.update(organization)
        if (resultOperation.matchedCount === 0) throw new UserError()
      }
    })

    return true
  } catch (error) {
    console.error(error)
    return error
  }
}

module.exports = { getUsersListByConversation, removeUserFromPlatform }
