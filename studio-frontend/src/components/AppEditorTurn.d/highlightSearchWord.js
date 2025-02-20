export default function highlightSearchWord(
  word,
  color,
  range,
  category,
  i18n,
  { isLastWord = false, isFirstWord = false } = {},
  iscurrent = false
) {
  word.setAttribute("found", "true")
  if (isFirstWord) {
    word.setAttribute("found-first-word", "true")
  }
  if (isLastWord) {
    word.setAttribute("found-last-word", "true")
  }
  if (iscurrent) {
    word.setAttribute("found-current-word", "true")
  }
}
