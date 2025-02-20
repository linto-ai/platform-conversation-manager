import EditorWorker from "../workers/collaboration-worker"

export function workerSendMessage(action, params) {
  EditorWorker.workerSingleton.sendMessage(action, params)
}

export function workerConnect(
  conversationId,
  userToken,
  userId,
  conversationFormat,
) {
  EditorWorker.workerSingleton.connect(
    conversationId,
    userToken,
    userId,
    conversationFormat,
  )
}

export function workerDisconnect() {
  workerSendMessage("disconnect")

  //setTimeout(EditorWorker.workerSingleton.terminate(), 2000)
}

export function workerListener() {
  EditorWorker.workerSingleton.getWorker().onmessage = (event) => {}
}
