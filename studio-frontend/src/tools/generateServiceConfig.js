export default function generateServiceConfig(
  service,
  {
    punctuationValue = "disabled",
    diarizationValue = "disabled",
    speakersNumberValue = 0,
    languageValue = service.language || "*",
  } = {},
) {
  const isWhisper = service.model_type === "whisper"

  return {
    serviceName: service.serviceName,
    endpoint: removeLeadingSlash(service.endpoints[0].endpoint),
    lang: languageValue,
    config: {
      language: languageValue,
      punctuationConfig: {
        enablePunctuation: punctuationValue !== "disabled",
        serviceName: punctuationValue !== "disabled" ? punctuationValue : null,
      },
      diarizationConfig: {
        enableDiarization: diarizationValue !== "disabled",
        numberOfSpeaker:
          diarizationValue !== "disabled" && speakersNumberValue > 0
            ? parseInt(speakersNumberValue)
            : null,
        maxNumberOfSpeaker: diarizationValue !== "disabled" ? 100 : null,
        serviceName: diarizationValue !== "disabled" ? diarizationValue : null,
      },
      enableNormalization: true,
      modelType: service.model_type,
      vadConfig: isWhisper
        ? {
            enableVAD: true,
            methodName: "WebRTC",
            minDuration: 30,
          }
        : {
            enableVAD: true,
            methodName: "WebRTC",
            minDuration: 0,
          },
    },
  }
}

function removeLeadingSlash(str) {
  return str.replace(/^\/+/, "")
}
