const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:controller:conversation:turn",
)

function isTurnLonger(turnOne, turnTwo) {
  let turn_one_stime = turnOne.words[0].stime
  let turn_one_etime = turnOne.words[turnOne.words.length - 1].etime
  let turn_two_stime = turnTwo.words[0].stime
  let turn_two_etime = turnTwo.words[turnTwo.words.length - 1].etime

  let turn_one_duration = turn_one_etime - turn_one_stime
  let turn_two_duration = turn_two_etime - turn_two_stime

  return turn_one_duration > turn_two_duration
}

module.exports = { isTurnLonger }
