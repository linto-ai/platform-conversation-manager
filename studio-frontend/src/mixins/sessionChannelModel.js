export const sessionChannelModelMixin = {
  computed: {
    p_channelObj() {
      return this?.[this.channelKeyObj] ?? this.channel
    },
    channelId() {
      return this?.p_channelObj?.id ?? this?.p_channelObj?.index
    },
    channelTranscriberStatus() {
      return this?.p_channelObj?.transcriberStatus
    },
    channelStreamStatus() {
      return this?.p_channelObj?.streamStatus
    },
    channelStreamEndpoint() {
      return this?.p_channelObj?.streamEndpoints
    },
    channelTranslations() {
      return this?.p_channelObj?.translations
    },
    channelLanguages() {
      return this?.p_channelObj?.languages
    },
    channelProfileName() {
      return this?.p_channelObj?.profileName
    },
    channelType() {
      return this?.p_channelObj?.type
    },
    channelAvailableTranslations() {
      return this?.p_channelObj?.availableTranslations
    },
    hasDiarization() {
      return !!this?.p_channelObj?.diarization
    },
  },
}
