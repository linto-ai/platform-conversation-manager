export default function getTextTurnWithTranslation(turn, selectedTranslations) {
  if (selectedTranslations === "original") {
    return turn.text ?? ""
  } else {
    return turn?.translations?.[selectedTranslations] ?? ""
  }
}
