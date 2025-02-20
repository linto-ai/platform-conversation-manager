export default function handleSpeakerClick(e) {
  e.preventDefault()
  if (this.canEdit) {
    this.displaySpeakerToolbox = true
  }
}
