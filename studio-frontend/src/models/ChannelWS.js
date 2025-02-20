import Vue from "vue"
import { customDebug } from "../tools/customDebug"

const debugWS = customDebug("Websocket:Channel:debug")

// Websocket to session transcriber to send audio
export default class ChannelWS {
  constructor(channel) {
    this.state = Vue.observable({
      isConnected: false,
      receivedACK: false,
    })

    this.socket = null
    this.channel = channel
    this.currentConfig = null
  }

  changeChannel(channel, newConfig) {
    this.channel = channel

    if (this.state.isConnected) {
      this.close()
    }

    let config = this.currentConfig
    if (newConfig) {
      config = newConfig
    }

    if (config) {
      return this.connectWithConfig(config)
    } else {
      return this.connect()
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = this.channel?.streamEndpoints?.ws
      if (!url) {
        debugWS("No valid websocket url")
        reject("No websocket url")
        return
      }

      this.socket = new WebSocket(url)
      this.socket.onopen = () => {
        debugWS("connected to websocket server")
        this.state.isConnected = true
        resolve()
      }
    })
  }

  connectWithConfig(config) {
    this.currentConfig = config
    return new Promise((resolve, reject) => {
      this.connect()
        .then(() => {
          this.socket.send(JSON.stringify(config))
          this.socket.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            if (msg.type === "ack") {
              debugWS("ack received")
              this.state.receivedACK = true
              resolve()
            } else {
              debugWS("ack not received", msg)
              reject("ack not received")
            }
          }
        })
        .catch((err) => {
          debugWS("Error connecting to websocket server", err)
          reject(err)
        })
    })
  }

  send(data) {
    if (this.state.isConnected) {
      this.socket.send(data)
    } else {
      debugWS("trying to send data without connection to websocket server")
    }
  }

  close() {
    this.socket.close()
    this.state.isConnected = false
    this.state.receivedACK = false
  }
}
