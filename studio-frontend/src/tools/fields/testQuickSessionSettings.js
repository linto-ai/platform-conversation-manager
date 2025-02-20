export function testQuickSessionSettings(field, t) {
  field.valid = true
  field.error = null
  const value = field.value

  console.log(value?.subInStudio, value?.offlineTranscription)
  if (!value?.subInStudio && !value?.offlineTranscription) {
    // need to check one of the two options
    field.error = t("quick_session.creation.live_or_offline_should_be_selected")
    field.valid = false
    return false
  }

  if (value?.subInStudio) {
    if (!value?.selectedProfile) {
      field.error = t("quick_session.creation.no_profile_selected_error")
      field.valid = false
      return false
    }
  }

  if (value?.offlineTranscription) {
    if (!value?.transcriptionService) {
      field.error = t("conversation.transcription_service_error")
      field.valid = false
      return false
    }
  }

  return field.valid
}
