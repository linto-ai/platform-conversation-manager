export default function unhighlightRange(
  { range },
  { functionToUnhighlightWord = unhighlightWord } = {}
) {
  let { startContainer, endContainer, startOffset, endOffset } = range
  let startWord = startContainer.children.item(startOffset)

  if (!startWord) return

  let endWord = endContainer.children.item(endOffset)

  if (!endWord || startWord === endWord) {
    functionToUnhighlightWord(startWord)
    return
  } else {
    do {
      functionToUnhighlightWord(startWord)
      startWord = startWord.nextSibling
    } while (startWord !== endWord)
    functionToUnhighlightWord(endWord)
  }

  //unhighlightWord(startWord)
}

function unhighlightWord(word) {
  word.removeAttribute("highlighted")
  word.removeAttribute("highlighted--last-word")
  word.removeAttribute("highlighted--first-word")
  word.classList.remove(
    ...Array.from(word.classList).filter((c) => c.startsWith("background-"))
  )
}
