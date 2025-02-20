let worker = new Worker(new URL("./collaborationWorker.js", import.meta.url), {
  type: "module",
})
class WorkerSingleton {
  constructor() {
    this.isTerminated = false

    if (WorkerSingleton.instance) {
      return WorkerSingleton.instance
    }

    this.worker = new Worker(
      new URL("./collaborationWorker.js", import.meta.url),
      { type: "module" }
    )
    WorkerSingleton.instance = this
  }

  sendMessage(action, params) {
    this.getWorker().postMessage({
      action,
      params,
    })
  }

  terminate() {
    this.isTerminated = true
    this.getWorker().terminate()
  }

  connect(conversationId, userToken, userId, conversationFormat) {
    if (this.isTerminated) {
      this.worker = new Worker(
        new URL("./collaborationWorker.js", import.meta.url),
        { type: "module" }
      )
      this.isTerminated = false
    }
    this.getWorker().postMessage({
      action: "connect",
      params: { conversationId, userToken, userId, conversationFormat },
    })
  }

  getWorker() {
    return this.worker
  }
}

const workerSingleton = new WorkerSingleton()

export default {
  worker,
  workerSingleton,
}
