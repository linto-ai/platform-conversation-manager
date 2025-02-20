const debug = require("debug")("linto:components:socketio")
const Component = require(`../component.js`)
const socketIO = require("socket.io")
const axios = require(`${process.cwd()}/lib/utility/axios`)
const appLogger = require(`${process.cwd()}/lib/logger/logger.js`)

const { diffSessions, groupSessionsByOrg } = require(
  `${process.cwd()}/components/IoHandler/controllers/SessionHandling`,
)

const auth_middlewares = require(
  `${process.cwd()}/components/WebServer/config/passport/local/middleware`,
)

class IoHandler extends Component {
  constructor(app) {
    super(app, "WebServer") // Relies on a WebServer component to be registrated
    this.id = this.constructor.name
    this.app = app
    this.rooms = {}
    this.orgas = {}
    this.sessionsCache = {}
    this.memorySessions = {}

    this.io = socketIO(this.app.components["WebServer"].httpServer, {
      cors: {
        origin: process.env.CORS_API_WHITELIST.split(","),
        methods: ["GET", "POST"],
        credentials: true,
      },
    })

    this.io.use(auth_middlewares.isAuthenticateSocket)

    this.io.on("connection", (socket) => {
      appLogger.debug(`New client connected : ${socket.id}`)

      socket.on("join_room", (roomId) => {
        appLogger.debug(`Client ${socket.id} joins room ${roomId}`)
        this.addSocketInRoom(roomId, socket)
      })

      socket.on("leave_room", (roomId) => {
        appLogger.debug(`Client ${socket.id} leaves room ${roomId}`)
        this.removeSocketFromRoom(roomId, socket)
      })

      socket.on("watch_organization", (orgaId) => {
        appLogger.debug(
          `Client ${socket.id} joins watcher session of orga ${orgaId}`,
        )
        this.addSocketInOrga(orgaId, socket)
      })

      socket.on("unwatch_organization", (orgaId) => {
        appLogger.debug(
          `Client ${socket.id} leaves watcher session of orga ${orgaId}`,
        )
        this.removeSocketFromOrga(orgaId, socket)
      })

      socket.on("disconnect", () => {
        appLogger.debug(`Client ${socket.id} disconnected`)
        this.searchAndRemoveSocketFromRooms(socket)
      })
    })

    return this.init()
  }

  async addSocketInOrga(orgaId, socket) {
    socket.join(orgaId)
    if (this.orgas.hasOwnProperty(orgaId)) {
      this.orgas[orgaId].add(socket.id)
    } else {
      this.orgas[orgaId] = new Set().add(socket.id)
      if (this.memorySessions[orgaId] === undefined) {
        try {
          const sessions = await axios.get(
            process.env.SESSION_API_ENDPOINT + `/sessions`,
          )
          sessions.sessions.forEach((session) => {
            if (this.memorySessions[session.id] === undefined) {
              this.memorySessions[session.id] = session.organizationId
            }
          })
        } catch (err) {
          appLogger.debug(
            `Error getting organization ID from the orga ${orgaId}: ${err}`,
          )
        }
      }
    }
  }

  removeSocketFromOrga(orgaId, socket) {
    socket.leave(orgaId)
    if (!this.orgas.hasOwnProperty(orgaId)) {
      return
    }

    this.orgas[orgaId].delete(socket.id)
    if (this.orgas[orgaId].size == 0) {
      delete this.orgas[orgaId]
    }
  }

  addSocketInRoom(roomId, socket) {
    socket.join(roomId)
    if (this.rooms.hasOwnProperty(roomId)) {
      this.rooms[roomId].add(socket.id)
      this.app.components["BrokerClient"].emit("join_room", roomId)
    } else {
      this.rooms[roomId] = new Set().add(socket.id)
      this.app.components["BrokerClient"].emit("join_room", roomId)
    }
  }

  searchAndRemoveSocketFromRooms(socket) {
    for (const [roomId, socketIds] of Object.entries(this.rooms)) {
      if (socketIds.has(socket.id)) {
        this.removeSocketFromRoom(roomId, socket)
      }
    }
  }

  removeSocketFromRoom(roomId, socket) {
    socket.leave(roomId)

    if (!this.rooms.hasOwnProperty(roomId)) {
      this.app.components["BrokerClient"].emit("leave_room", roomId)
      return
    }

    this.rooms[roomId].delete(socket.id)
    if (this.rooms[roomId].size == 0) {
      delete this.rooms[roomId]
      this.app.components["BrokerClient"].emit("leave_room", roomId)
    }
  }

  //broadcasts to connected sockets
  notify(roomId, action, transcription) {
    if (this.io.sockets.adapter.rooms.has(roomId)) {
      this.io.to(roomId).emit(action, transcription)
    }
  }

  async notify_sessions(roomId, action, sessions) {
    const differences = diffSessions(this.sessionsCache, sessions)
    const merged = await groupSessionsByOrg(differences, this.memorySessions)
    Object.keys(merged).forEach((orgaId) => {
      //Verify if a websocket connection is establish to the room
      if (this.io.sockets.adapter.rooms.has(orgaId)) {
        this.io.to(orgaId).emit(`orga_${orgaId}_${action}`, merged[orgaId])
      }
    })
    this.sessionsCache = sessions
  }

  brokerOk() {
    this.io.emit("broker_ok")
  }

  brokerKo() {
    this.io.emit("broker_ko")
  }
}

module.exports = (app) => new IoHandler(app)
