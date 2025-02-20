import { diffArrays } from "diff"

export default function splitPartialSubtitles(
  { previousText, previousIndexes: oldCutPositions },
  newText,
  computeIfTextIsTooLong,
) {
  if (!newText) {
    return {
      previousText,
      previousIndexes: oldCutPositions,
    }
  }

  const previousTextSplitBySpace = previousText.split(" ")
  const newTextSplitBySpace = newText.split(" ")
  const diffList = diffArrays(previousTextSplitBySpace, newTextSplitBySpace, {
    comparator: isSameWord,
  })

  const diffListWithReplacements = detectReplacements(diffList)

  const copyCutPositions = [...oldCutPositions]
  let newCutPositions = [...oldCutPositions]

  let wordIndex = 0
  for (const diff of diffListWithReplacements) {
    do {
      if (wordIndex < copyCutPositions[0]) {
        break
      }
    } while (copyCutPositions.shift())

    if (copyCutPositions.length == 0) {
      // last line
      break
    }

    switch (true) {
      case diff.replaced:
        newCutPositions = incrementIndexes(
          newCutPositions,
          copyCutPositions[0],
          diff.countAdded - diff.countRemoved,
        )
        wordIndex += diff.countRemoved
        break

      case diff.removed:
        wordIndex += diff.count
        newCutPositions = incrementIndexes(
          newCutPositions,
          copyCutPositions[0],
          -diff.count,
        )
        break

      case diff.added:
        newCutPositions = incrementIndexes(
          newCutPositions,
          copyCutPositions[0],
          diff.count,
        )
        break
      default:
        // keep
        wordIndex += diff.count
        break
    }
  }

  const lastLinePosition = newCutPositions.at(-1) ?? 0
  let lastLine = newTextSplitBySpace.slice(lastLinePosition).join(" ")
  if (computeIfTextIsTooLong(lastLine)) {
    const cutPositionsForLastLine = getIndexesWhereToCutText(
      lastLine,
      computeIfTextIsTooLong,
    )
    const cutPositionsForLastLineIncremented = cutPositionsForLastLine.map(
      (index) => index + lastLinePosition,
    )
    newCutPositions = newCutPositions.concat(cutPositionsForLastLineIncremented)
  }

  return {
    previousIndexes: newCutPositions,
    previousText: newText,
  }
}

function detectReplacements(diffList) {
  const diffListWithReplacements = []

  for (let i = 0; i < diffList.length; i++) {
    const currentDiff = diffList[i]
    // keep or added
    if (!currentDiff.removed) {
      diffListWithReplacements.push(currentDiff)
      continue
    }

    if (i + 1 < diffList.length) {
      const nextDiff = diffList[i + 1]
      if (nextDiff.added) {
        diffListWithReplacements.push({
          replaced: true,
          removed: currentDiff.removed,
          added: nextDiff.added,
          countRemoved: currentDiff.count,
          countAdded: nextDiff.count,
        })
        i++ // skip next step (the added step)
        continue
      }

      diffListWithReplacements.push(currentDiff)
    }
  }

  return diffListWithReplacements
}

function incrementIndexes(indexes, from, increment) {
  return indexes.map((index) => (index >= from ? index + increment : index))
}

export function getIndexesWhereToCutText(text, computeIfTextIsTooLong) {
  const splitText = text.split(" ")
  if (!computeIfTextIsTooLong(text) || splitText.length <= 1) {
    return []
  } else {
    let i
    for (i = 0; i < splitText.length; i++) {
      const currentText = splitText.slice(0, i).join(" ")
      if (computeIfTextIsTooLong(currentText)) {
        break
      }
    }

    return [i - 1].concat(
      incrementIndexes(
        getIndexesWhereToCutText(
          splitText.slice(i - 1).join(" "),
          computeIfTextIsTooLong,
        ),
        0,
        i - 1,
      ),
    )
  }
}

function isSameWord(word1, word2) {
  const w1Normalized = word1
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
  const w2Normalized = word2
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")

  const word1Length = w1Normalized.length
  const word2Length = w2Normalized.length

  const shortestLength = Math.min(word1Length, word2Length)

  let numberOfSameChars = 0
  for (let i = 0; i < shortestLength; i++) {
    if (w1Normalized[i].toLowerCase() === w2Normalized[i].toLowerCase()) {
      numberOfSameChars++
    }
  }

  const similarity = numberOfSameChars / word1Length
  return similarity > 0.8
}
