export default function findInSegment(wordList, search) {
  const segment = wordList.join(" ")
  const searchIndex = segment.indexOf(search)

  if (searchIndex === -1) {
    return []
  }

  const listExpression = []
  let found = segment.indexOf(search)
  while (found !== -1) {
    listExpression.push(getWordIndex(segment, found, found + search.length))
    found = segment.indexOf(search, found + 1)
  }

  return listExpression
}

function getWordIndex(segment, startIndex, endIndex) {
  const before = segment.slice(0, startIndex)
  const wordsBefore = before.split(" ")

  const after = segment.slice(0, endIndex)
  const wordsAfter = after.split(" ")

  return {
    start: wordsBefore.length - 1,
    end: wordsAfter.length - 1,
  }
}
