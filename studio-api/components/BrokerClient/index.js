const debug = require("debug")(`linto:components:BrokerClient`)

const Component = require(`../component.js`)
const MqttClient = require(`${process.cwd()}/lib/mqtt/mqtt.js`)

class BrokerClient extends Component {
  static states = {
    CONNECTING: "connecting",
    READY: "ready",
    ERROR: "error",
  }

  _state = null

  constructor(app) {
    super(app)
    const { CONNECTING, READY, ERROR } = this.constructor.states
    this.id = this.constructor.name
    this.deliveryState = CONNECTING
    this.sessionState = CONNECTING

    // Combined pub and subs
    this.deliveryPub = "delivery"
    this.deliverySubTemplates = [
      // roomId is the concatenation of session_id / channel_index
      (roomId) => `transcriber/out/${roomId}/partial`,
      (roomId) => `transcriber/out/${roomId}/final`,
    ]
    this.deliverySubs = [
      `transcriber/out/+/+/partial`,
      `transcriber/out/+/+/final`,
    ]

    // Initialize delivery client
    this.deliveryClient = new MqttClient({
      pub: this.deliveryPub,
      subs: this.deliverySubs,
      retain: false,
      uniqueId: "delivery",
    })
    this.deliveryClient.on("ready", () => {
      this.deliveryState = READY
    })
    this.deliveryClient.on("error", (err) => {
      this.deliveryState = ERROR
    })

    this.sessionPub = `session/out`
    this.sessionSubs = [`session/in/+/#`]
    // Initialize session client
    this.sessionClient = new MqttClient({
      pub: this.sessionPub,
      subs: this.sessionSubs,
      retain: false,
      uniqueId: "session-api",
    })
    this.sessionClient.on("ready", () => {
      this.sessionState = READY
      this.sessionClient.publishStatus()
    })
    this.sessionClient.on("error", (err) => {
      this.sessionState = ERROR
    })

    this.organizationPub = `system/out/sessions/statuses`
    this.organizationSubs = [`system/out/sessions/statuses`]
    // Initialize session client
    this.organizationClient = new MqttClient({
      pub: this.organizationPub,
      subs: this.organizationSubs,
      retain: false,
      uniqueId: "organization-api",
    })
    this.organizationClient.on("ready", () => {
      this.organizationState = READY
      this.organizationClient.publishStatus()
    })
    this.organizationClient.on("error", (err) => {
      this.organizationState = ERROR
    })

    this.organizationClient.subscribe(`system/out/sessions/statuses`)

    this.init() // binds controllers, those will handle messages
  }

  subscribe(roomId) {
    debug(`Subscribe to transcriber ${roomId}`)
    for (const sub_template of this.deliverySubTemplates) {
      this.deliveryClient.subscribe(sub_template(roomId))
    }
  }

  unsubscribe(roomId) {
    debug(`Unsubscribe from transcriber ${roomId}`)
    for (const sub_template of this.deliverySubTemplates) {
      this.deliveryClient.unsubscribe(sub_template(roomId))
    }
  }
}

module.exports = (app) => new BrokerClient(app)
