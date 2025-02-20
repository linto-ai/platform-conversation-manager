import SubtitleHelper from "../models/subtitles.js"
import { v4 as uuidv4 } from "uuid"

export default async function updateSubtitlesController(data) {
  try {
    const deltaId = uuidv4()
    let subtitle = SubtitleHelper.getById(data.subtitleId)

    const delta = data.binaryDelta

    if (!delta) {
      throw "delta is empty"
    }
    subtitle.applyBinaryDelta(
      delta,
      deltaId,
      true,
      (dataApplied) => {
        if (dataApplied) {
          let room = `subtitle/${data.subtitleId}`
          this.to(room).emit("subtitle_updated", {
            origin: data.origin,
            delta,
          })
        } else {
          this.emit("error")
        }
      },
      data.userToken,
    )
  } catch (error) {
    console.log(error)
    this.emit("error")
  }
}
