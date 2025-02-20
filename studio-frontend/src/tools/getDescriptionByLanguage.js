export default function getDescriptionByLanguage(descriptionDict, language) {
  // transform language to get the first two letters
  language = language.substring(0, 2)
  if (descriptionDict[language]) {
    return descriptionDict[language]
  } else if (descriptionDict["en"]) {
    return descriptionDict["en"]
  } else {
    // return the first one
    return Object.values(descriptionDict)[0]
  }
}
