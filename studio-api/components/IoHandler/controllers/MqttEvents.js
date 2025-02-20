const debug = require("debug")("linto:components:IoHandler:mqtt-events")

const retryInterval = 1000 // Retry every 5 seconds
const maxRetries = 5 // Maximum number of retries

// The BrokerClient need to know if the IoHandler is connected to the broker
const retryConnectionOperation = (operation, app, retryCount = 0) => {
  if (app.components["IoHandler"]) {
    operation()
  } else if (retryCount < maxRetries) {
    setTimeout(
      () => retryConnectionOperation(operation, app, retryCount + 1),
      retryInterval,
    )
  } else {
    debug("IoHandler not loaded after maximum retries")
  }
}

module.exports = function () {
  this.app.components["BrokerClient"].deliveryClient.on("error", () => {
    retryConnectionOperation(
      () => this.app.components["IoHandler"].brokerKo(),
      this.app,
    )
  })

  this.app.components["BrokerClient"].deliveryClient.on("offline", () => {
    retryConnectionOperation(
      () => this.app.components["IoHandler"].brokerKo(),
      this.app,
    )
  })

  this.app.components["BrokerClient"].deliveryClient.on("ready", () => {
    retryConnectionOperation(
      () => this.app.components["IoHandler"].brokerOk(),
      this.app,
    )
  })

  this.app.components["BrokerClient"].organizationClient.on("error", () => {
    retryConnectionOperation(
      () => this.app.components["IoHandler"].brokerKo(),
      this.app,
    )
  })

  this.app.components["BrokerClient"].organizationClient.on("offline", () => {
    retryConnectionOperation(
      () => this.app.components["IoHandler"].brokerKo(),
      this.app,
    )
  })

  this.app.components["BrokerClient"].organizationClient.on("ready", () => {
    retryConnectionOperation(
      () => this.app.components["IoHandler"].brokerOk(),
      this.app,
    )
  })
}
