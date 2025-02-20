import { workerSendMessage } from "@/tools/worker-message.js"

export default function handleBlur(e) {
  this.focused = false
  this.contentEditable = false
  if (this.splitting) {
    this.splitting = false
    return
  } else {
    workerSendMessage("turn_edit_text", {
      turnId: this.turnId,
      newText: e.target.innerText,
      oldText: this.segment,
      words: this.words,
      index: this.index,
    })
    this.displayHighlights()
    this.refreshSearchResults()
  }
}
