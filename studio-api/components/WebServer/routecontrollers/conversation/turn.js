const debug = require("debug")(
  `linto:conversation-manager:components:WebServer:routeControllers:turn`,
)

const model = require(`${process.cwd()}/lib/mongodb/models`)

const { v4: uuidv4 } = require("uuid")
const { isTurnLonger } = require(
  `${process.cwd()}/components/WebServer/controllers/conversation/turn`,
)

const {
  ConversationIdRequire,
  ConversationNotFound,
  ConversationError,
  TurnIdRequire,
  TurnNotFound,
  ConversationUnsupportedMediaType,
} = require(
  `${process.cwd()}/components/WebServer/error/exception/conversation`,
)

async function addTurn(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    if (!req.params.turnId) throw new TurnIdRequire() // Will add a turn after that turnId

    let conversationId = req.params.conversationId
    const conversation = await model.conversations.getById(conversationId)
    if (conversation.length !== 1) throw new ConversationNotFound()

    let addedTurn = []
    let isTurnAdded = false
    conversation[0].text.map((turn, i) => {
      addedTurn.push(turn)
      if (turn.turn_id === req.params.turnId) {
        addedTurn.push({ ...req.body, turn_id: uuidv4() })
        isTurnAdded = true
      }
    })

    if (!isTurnAdded) throw new TurnNotFound()

    const result = await model.conversations.updateTurn(
      req.params.conversationId,
      addedTurn,
    )
    if (result.matchedCount === 0) throw new ConversationError()

    res.status(200).send({
      message: "Conversation turn has been added",
    })
  } catch (err) {
    next(err)
  }
}

async function deleteTurn(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    if (!req.params.turnId) throw new TurnIdRequire()

    let conversationId = req.params.conversationId
    const conversation = await model.conversations.getById(conversationId)
    if (conversation.length !== 1) throw new ConversationNotFound()

    const turnToRemove = conversation[0].text.filter(
      (turn) => turn.turn_id !== req.params.turnId,
    )
    if (conversation[0].text.length === turnToRemove.length)
      throw new TurnNotFound()

    const result = await model.conversations.updateTurn(
      req.params.conversationId,
      turnToRemove,
    )
    if (result.matchedCount === 0) throw new ConversationError()

    res.status(200).send({
      message: "Conversation turn has been deleted",
    })
  } catch (err) {
    next(err)
  }
}

async function updateTurn(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    if (!req.params.turnId) throw new TurnIdRequire()

    let conversationId = req.params.conversationId
    let conversation = await model.conversations.getById(conversationId)
    if (conversation.length !== 1) throw new ConversationNotFound()

    let updatedTurn = []
    let isTurnUpdated = false

    for (let turn of conversation[0].text) {
      if (turn.turn_id === req.params.turnId) {
        turn = req.body
        turn.turn_id = req.params.turnId
        isTurnUpdated = true
      }
      updatedTurn.push(turn)
    }

    if (!isTurnUpdated) throw new TurnNotFound()

    const result = await model.conversations.updateTurn(
      req.params.conversationId,
      updatedTurn,
    )
    if (result.matchedCount === 0) throw new ConversationError()

    res.status(200).send({
      message: "Conversation turn has been updated",
    })
  } catch (err) {
    next(err)
  }
}

async function mergeTurn(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    if (!req.params.turnId) throw new TurnIdRequire()
    if (!req.params.direction)
      throw new ConversationUnsupportedMediaType("Direction is required")

    //direction must be next or previous
    const direction = req.params.direction
    if (direction !== "next" && direction !== "previous")
      throw new ConversationUnsupportedMediaType(
        "Direction must be next or previous",
      )

    let conversationId = req.params.conversationId
    let conversation = await model.conversations.getById(conversationId)
    if (conversation.length !== 1) throw new ConversationNotFound()

    //find the turn id and merge with the direction
    let isTurnFound = false
    let updatedTurn = []
    let turnResult = {}
    for (let turn of conversation[0].text) {
      if (turn.turn_id === req.params.turnId) {
        isTurnFound = true
        if (direction === "next") {
          updatedTurn.push(turn)
        }
      }

      if (isTurnFound) {
        let isLonger
        if (updatedTurn.length > 0)
          isLonger = isTurnLonger(updatedTurn[updatedTurn.length - 1], turn)

        if (direction === "next" && turn.turn_id !== req.params.turnId) {
          // Is

          //remove the next turn
          updatedTurn[updatedTurn.length - 1].raw_segment =
            updatedTurn[updatedTurn.length - 1].raw_segment +
            " " +
            turn.raw_segment
          updatedTurn[updatedTurn.length - 1].segment =
            updatedTurn[updatedTurn.length - 1].segment + " " + turn.segment
          updatedTurn[updatedTurn.length - 1].words.push(...turn.words)

          if (!isLonger)
            updatedTurn[updatedTurn.length - 1].speaker_id = turn.speaker_id

          isTurnFound = false
          turnResult = updatedTurn[updatedTurn.length - 1]
        } else if (direction === "previous") {
          if (updatedTurn.length === 0) {
            //  if first turn, nothing to merge
            updatedTurn.push(turn)
          } else {
            updatedTurn[updatedTurn.length - 1].raw_segment =
              updatedTurn[updatedTurn.length - 1].raw_segment +
              " " +
              turn.raw_segment
            updatedTurn[updatedTurn.length - 1].segment =
              updatedTurn[updatedTurn.length - 1].segment + " " + turn.segment
            updatedTurn[updatedTurn.length - 1].words.push(...turn.words)
            if (!isLonger)
              updatedTurn[updatedTurn.length - 1].speaker_id = turn.speaker_id
            turnResult = updatedTurn[updatedTurn.length - 1]
          }
          turnResult = updatedTurn[updatedTurn.length - 1]
          isTurnFound = false
        }
      } else updatedTurn.push(turn)
    }

    await model.conversations.updateTurn(req.params.conversationId, updatedTurn)
    if (conversation[0].text.length === updatedTurn.length) {
      res.status(304).send({
        message: "Nothing to merge",
      })
    } else {
      res.status(200).send(turnResult)
    }
  } catch (err) {
    next(err)
  }
}

async function search(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    if (!req.query.text) throw new ConversationUnsupportedMediaType()

    let turns = []
    const conversation = await model.conversations.getById(
      req.params.conversationId,
    )
    if (conversation.length !== 1) throw new ConversationNotFound()

    conversation[0].text.map((turn) => {
      if (turn.segment.toLowerCase().includes(req.query.text.toLowerCase()))
        turns.push(turn.turn_id)
    })
    if (turns.length === 0) res.status(204).send()
    else res.status(200).send(turns)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  addTurn,
  deleteTurn,
  updateTurn,
  mergeTurn,
  search,
}
