const EventEmitter = require("eventemitter3")
const Mqtt = require("mqtt")

class MqttClient extends EventEmitter {
  static states = {
    CONNECTING: "connecting",
    READY: "ready",
    ERROR: "error",
  }

  static defaultOptions = {
    subs: [], // array of topics to subscribe to
    pub: null, // root of topics to publish to
    uniqueId: "void", // unique ID within MQTT, not related to MQTT client ID used for business logic
    protocol: process.env.BROKER_PROTOCOL, //mqtt, mqtts
    host: process.env.BROKER_HOST,
    port: process.env.BROKER_PORT,
    keepalive: process.env.BROKER_KEEPALIVE,
    username: process.env.BROKER_USERNAME,
    password: process.env.BROKER_PASSWORD,
    qos: 2,
    retain: false,
  }

  constructor(options = {}) {
    super()
    this.status = MqttClient.states.CONNECTING
    this.options = { ...MqttClient.defaultOptions, ...options }
    this.cnxParam = {
      protocol: this.options.protocol,
      clean: true,
      servers: [
        {
          host: this.options.host,
          port: this.options.port,
        },
      ],
      keepalive: parseInt(this.options.keepalive), //can live for LOCAL_MQTT_KEEP_ALIVE seconds without a single message sent on broker
      reconnectPeriod: Math.floor(Math.random() * 3000) + 2000, // ms for reconnect, ensure that all clients don't reconnect at the same time
      will: {
        topic: `${this.options.pub}/status`,
        retain: this.options.retain,
        //Do not work for some reason ... currently using mosquitto
        //retain shall be set to false to avoid the broker to keep the message after the client has reconnected
        // and properties seems to be ignored by mosquitto
        // properties: {
        //     messageExpiryInterval: 100 * 60 //* 60 * 60 * 24, // dead clients annonced for 1 day (session management)
        //     //willDelayInterval: 1, // 1 minute meant to be used to cater for short network outages
        // },
        payload: JSON.stringify({
          uniqueId: this.options.uniqueId,
          online: false,
        }),
      },
      qos: this.options.qos,
    }
    this.init()
  }

  // those values are specific to the domain (language, provider, etc.)
  // will get updated when session is bound or other status changes
  // !!! is sent to broker using mqtt client pubishStatus method !!!
  registerDomainSpecificValues(domainValues) {
    this.domainValues = { ...this.domainValues, ...domainValues }
  }

  async init() {
    this.client = Mqtt.connect(this.cnxParam)
    this.client.on("connect", () => {
      if ((!"subs") in this.options || this.options.subs.length == 0) {
        this.emit("ready")
        return
      }
      //clean any previous subscriptions
      this.client.unsubscribe(this.options.subs, (error) => {
        if (error) {
          this.emit(`error`, error) //non blocking error, keeps connecting
        } else {
          //subscribe to the inTopic /# to receive all messages sent to this client
          this.client.subscribe(
            this.options.subs,
            { qos: this.options.qos },
            (error) => {
              if (error) {
                this.emit(`error`, error)
                this.status = MqttClient.states.ERROR
              } else {
                this.emit(`ready`)
              }
            },
          )
        }
      })
    })

    this.client.on("message", (topic, message) => {
      this.emit(`message`, topic, message)
    })
    this.client.on("error", (error) => {
      this.emit(`error`, error)
    })
    this.client.on("close", () => {
      this.emit(`close`)
    })
    this.client.on("offline", () => {
      this.emit(`offline`)
    })
  }

  subscribe(topic) {
    // add the topic even if the subscribe to the MQTT server doesn't work
    // it allows to reconnect as soon as the server comes back
    if (!this.options.subs) {
      this.options.subs = [topic]
    } else {
      this.options.subs.push(topic)
    }

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        this.emit(`error`, error) //non blocking error, keeps connecting
      } else {
        this.client.subscribe(topic, { qos: this.options.qos }, (error) => {
          if (error) {
            this.emit(`error`, error)
            this.status = MqttClient.states.ERROR
          } else {
            this.emit(`ready`)
          }
        })
      }
    })
  }

  unsubscribe(topic) {
    const topicIndex = this.options.subs.indexOf(topic)
    if (topicIndex >= 0) {
      delete this.options.subs[topicIndex]
    }

    this.client.unsubscribe(topic, { qos: this.options.qos }, (error) => {
      if (error) {
        this.emit(`error`, error)
        this.status = MqttClient.states.ERROR
      } else {
        this.emit(`ready`)
      }
    })
  }

  /**
   * Publishes a payload to the specified topic.
   * @param {string} topic - The topic to publish the message to.
   * @param {any} payload - The message to publish (JSON Payload mostly)
   * @param {number} [qos=this.options.qos] - The quality of service level to use for the message.
   * @param {boolean} [retain=false] - Whether or not to retain the message on the broker.
   * @param {boolean} [requireOnline=false] - Whether or not the client must be connected to the broker to publish the message.
   */
  publish(
    topic,
    payload,
    qos = this.options.qos,
    retain = false,
    requireOnline = true,
  ) {
    //if topic contains a /, it is a full topic, otherwise it is a subtopic of the client root
    let publishTopic
    if (topic.indexOf("/") === -1) {
      publishTopic = `${this.options.pub}/${topic}`
    } else {
      publishTopic = `${topic}`
    }
    const publishOptions = { qos, retain }
    if (requireOnline && this.client.connected) {
      this.client.publish(
        publishTopic,
        JSON.stringify(payload),
        publishOptions,
        (error) => {
          this.status = MqttClient.states.ERROR
          if (error) {
            this.emit(`error`, error)
          }
        },
      )
    }
  }

  // additionalPayload is used to add some data to the payload
  publishStatus(additionalPayload = {}) {
    let payload = {
      uniqueId: this.options.uniqueId,
      online: true,
      on: new Date().toJSON(),
    }
    payload = { ...payload, ...this.domainValues, ...additionalPayload }
    this.publish(`status`, payload, 2, this.options.retain, true)
  }
}

module.exports = MqttClient
