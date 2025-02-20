const debug = require("debug")(
  "linto:components:BrokerClient:mqtt-events-delivery",
)

module.exports = function () {
  this.deliveryClient.on("message", (topic, message) => {
    let type, out, session_id, channel_index, action
    try {
      // Attempt to split the topic into parts
      ;[type, out, session_id, channel_index, action] = topic.split("/")
    } catch (error) {
      // Handle the split error (e.g., skip processing, return early, etc.)
      console.error("Error splitting topic:", error)
      return
    }

    try {
      // Attempt to parse the message, it should be a JSON string
      let parsedMessage = JSON.parse(message.toString())
      this.app.components["IoHandler"].emit(
        action,
        session_id + "/" + channel_index,
        parsedMessage,
      )
    } catch (error) {
      this.app.components["IoHandler"].emit(
        "error",
        session_id + "/" + channel_index,
        { error: "Error parsing message" },
      )
      return
    }
  })

  this.organizationClient.on("message", (topic, message) => {
    let parsedMessage = JSON.parse(message.toString())

    if (this.app.components["IoHandler"] === undefined) {
      console.log("IoHandler not loaded yet")
      return
    }
    this.app.components["IoHandler"].emit(
      "watch_organization",
      topic,
      parsedMessage,
    )
  })

  this.on("join_room", (roomId) => {
    this.subscribe(roomId)
  })

  this.on("leave_room", (roomId) => {
    this.unsubscribe(roomId)
  })
}
