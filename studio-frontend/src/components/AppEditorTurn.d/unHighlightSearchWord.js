export default function unHighlightSearchWord(word) {
  word.removeAttribute("found-first-word")
  word.removeAttribute("found-last-word")
  word.removeAttribute("found-current-word")
  word.removeAttribute("found")
}
