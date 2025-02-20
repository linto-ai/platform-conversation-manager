const debug = require("debug")("linto:components:IoHandler:Session-Handling")
const axios = require(`${process.cwd()}/lib/utility/axios`)

const { storeSession } = require(
  `${process.cwd()}/components/WebServer/controllers/session/conversation.js`,
)

function diffSessions(oldSessions, newSessions) {
  if (oldSessions.length === undefined) {
    return {
      added: newSessions,
      removed: [],
      updated: [],
    }
  }

  const added = []
  const removed = []
  const updated = []

  const oldSessionsMap = new Map(
    oldSessions.map((session) => [session.id, session]),
  )
  const newSessionsMap = new Map(
    newSessions.map((session) => [session.id, session]),
  )

  newSessions.forEach((session) => {
    const oldSession = oldSessionsMap.get(session.id)
    if (!oldSession) {
      added.push(session)
    } else if (JSON.stringify(oldSession) !== JSON.stringify(session)) {
      updated.push(session)
    }
  })

  oldSessions.forEach((session) => {
    if (!newSessionsMap.has(session.id)) {
      removed.push(session)
    }
  })

  return { added, removed, updated }
}

async function groupSessionsByOrg(differences, sessionIdToOrg) {
  const groupedByOrg = {}

  async function getOrganizationId(session) {
    try {
      if (sessionIdToOrg[session.id]) {
        return sessionIdToOrg[session.id]
      } else {
        // Get session information when we don't know that session yet
        const response = await axios.get(
          process.env.SESSION_API_ENDPOINT + `/sessions/${session.id}`,
        )
        const orgId = response.organizationId
        sessionIdToOrg[session.id] = orgId // Cache the result for future calls
        return orgId
      }
    } catch (err) {
      debug(`Error getting organization ID for session ${session.id}: ${err}`)
      return null
    }
  }

  // Function to add session to the appropriate group under the organization
  async function addToGroup(orgId, type, session) {
    if (!orgId) {
      debug(`Session ${session.id} has no organization`)
      return
    }
    if (!groupedByOrg[orgId]) {
      groupedByOrg[orgId] = { added: [], removed: [], updated: [] }
    }
    groupedByOrg[orgId][type].push(session)
  }

  // Process each type of session difference
  for (const session of differences.added) {
    const orgId = await getOrganizationId(session)
    await addToGroup(orgId, "added", session)
  }
  for (const session of differences.removed) {
    const orgId = await getOrganizationId(session)
    await addToGroup(orgId, "removed", session)

    // We store the session when it's finished and not deleted
    try {
      const sessionEnded = await axios.get(
        process.env.SESSION_API_ENDPOINT + `/sessions/${session.id}`,
      )
      storeSession(sessionEnded)
    } catch (err) {
      debug(`Error storing session ${session.id}, it was deleted: ${err}`)
    }
  }
  for (const session of differences.updated) {
    const orgId = await getOrganizationId(session)
    await addToGroup(orgId, "updated", session)
  }

  return groupedByOrg
}

module.exports = { diffSessions, groupSessionsByOrg }
