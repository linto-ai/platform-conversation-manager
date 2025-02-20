import uuidv4 from "uuid/v4.js"

import { arraySum } from "./arraySum.js"
import { countSyllabsFromWord } from "./countSyllabsFromWord.js"

// not used see wordsDeltafromPlainDiffV2
export function wordsDeltafromPlainDiff(newText, words, plainDiff, syllabic) {
  const newWordsPlain = newText.split(" ").filter((word) => word !== "")
  const wordsWithoutEmpty = words.filter((w) => w.word !== "")

  let delta = []
  let indexOfLastRetain = 0
  let numberOfSpaces = 0

  for (const change of plainDiff) {
    const { at: positionDel, del: numberWordsDeleted } =
      deleteChangeWithEmptyWord(change, words)
    // add empty word
    const { at: positionAdd, add: numberWordsAdded } = change.rhs
    const retainBeforeOp = positionDel - indexOfLastRetain //+ numberOfemptyWordBetween(words, indexOfLastRetain, positionDel)

    if (isInlastPosition(change, newWordsPlain, words)) {
      delta.push({ retain: retainBeforeOp + 1 })
      delta = delta.concat(insertAtLastPosition(change, newWordsPlain, words))
      indexOfLastRetain = positionAdd + numberWordsAdded
      continue
    }

    if (isInFirstPosition(change, newWordsPlain, words)) {
      delta = delta.concat(insertAtFirstPosition(change, newWordsPlain, words))
      continue
    }

    if (retainBeforeOp > 0) {
      delta.push({ retain: retainBeforeOp })
    }

    delta = delta.concat(deleteOperation(numberWordsDeleted))

    if (numberWordsAdded > 0) {
      delta = delta.concat(
        insertWordsObject(
          positionDel,
          numberWordsDeleted,
          positionAdd,
          numberWordsAdded,
          words,
          newWordsPlain,
          syllabic
        )
      )
    } else {
      delta = delta.concat(insertEmptyWord(change, words))
    }
    indexOfLastRetain = positionDel + numberWordsDeleted
  }

  if (words.length > indexOfLastRetain) {
    delta.push({ retain: words.length - indexOfLastRetain })
  }

  return delta
}

function insertEmptyWord(change, words) {
  const { at: positionDel, del: numberWordsDeleted } = change.lhs
  const insert = []

  for (let i = 0; i < numberWordsDeleted; i = i + 1) {
    insert.push({
      stime: words[positionDel + i].stime,
      etime: words[positionDel + i].etime,
      word: "",
      wid: generateID(),
    })
  }

  return [{ insert }]
}

function insertWordsObject(
  positionDel,
  numberWordsDeleted,
  positionAdd,
  numberWordsAdded,
  words,
  newWordsPlain,
  syllabic
) {
  const insert = []
  const interval = getTimestampInterval(
    words,
    positionDel,
    positionDel + numberWordsDeleted - 1
  )

  const syllabesCount = countSyllabsFromPlainWordsList(
    newWordsPlain.slice(positionAdd, positionAdd + numberWordsAdded),
    syllabic
  )

  const syllabeDuration = (interval.etime - interval.stime) / syllabesCount

  let stime = words[positionDel].stime
  for (let i = 0; i < numberWordsAdded; i = i + 1) {
    const currentPlainWord = newWordsPlain[positionAdd + i]
    const etime = simplifyNumber(
      stime + syllabeDuration * countSyllabsFromWord(currentPlainWord, syllabic)
    )
    insert.push({
      stime,
      etime,
      word: currentPlainWord,
      wid: generateID(),
    })
    stime = etime
  }

  return [{ insert }]
}

function getTimestampInterval(words, indexStart, indexEnd) {
  return {
    stime: words[indexStart].stime,
    etime: words[indexEnd].etime,
  }
}

function countSyllabsFromPlainWordsList(plainWordsArray, syllabic) {
  return arraySum(plainWordsArray.map((w) => countSyllabsFromWord(w, syllabic)))
}

function simplifyNumber(number) {
  return parseFloat(number.toFixed(2))
}

function deleteOperation(deleteNumber) {
  if (deleteNumber < 1) {
    return []
  } else {
    return [{ delete: deleteNumber }]
  }
}

function isInlastPosition(change, newWordsPlain, words) {
  const { at: positionDel, del: numberWordsDeleted } = change.lhs
  const { at: positionAdd, add: numberWordsAdded } = change.rhs
  return newWordsPlain[positionAdd - 1] == words[positionDel].word
}

function isInFirstPosition(change, newWordsPlain, words) {
  const { at: positionDel, del: numberWordsDeleted } = change.lhs
  const { at: positionAdd, add: numberWordsAdded } = change.rhs
  return positionAdd == 0 && positionDel == 0 && numberWordsDeleted == 0
}

function insertAtLastPosition(change, newWordsPlain, words) {
  const { at: positionDel, del: numberWordsDeleted } = change.lhs
  const { at: positionAdd, add: numberWordsAdded } = change.rhs

  const time = words[positionDel].etime
  const insert = []

  for (let i = 0; i < numberWordsAdded; i = i + 1) {
    insert.push({
      etime: time,
      stime: time,
      word: newWordsPlain[positionAdd + i],
      wid: generateID(),
    })
  }

  return [{ insert }]
}

function insertAtFirstPosition(change, newWordsPlain, words) {
  const { at: positionDel, del: numberWordsDeleted } = change.lhs
  const { at: positionAdd, add: numberWordsAdded } = change.rhs

  const time = words[positionDel].stime
  const insert = []

  for (let i = 0; i < numberWordsAdded; i = i + 1) {
    insert.push({
      etime: time,
      stime: time,
      word: newWordsPlain[positionAdd + i],
      wid: generateID(),
    })
  }

  return [{ insert }]
}

//TODO: add caching for this function
export function numberOfemptyWordBetween(turnWords, startIndex, endIndex) {
  const emptyWordBefore =
    startIndex == 0 ? 0 : numberOfemptyWordBetween(turnWords, 0, startIndex)

  let numberOfEmptyWord = 0
  for (
    let index = startIndex + emptyWordBefore;
    index <= endIndex + numberOfEmptyWord + emptyWordBefore &&
    index < turnWords.length;
    index++
  ) {
    if (turnWords[index].word == "") {
      numberOfEmptyWord++
    }
  }
  return numberOfEmptyWord
}

function deleteChangeWithEmptyWord(change, words) {
  const { at: positionDel, del: numberWordsDeleted } = change.lhs
  const { at: positionAdd, add: numberWordsAdded } = change.rhs

  if (positionDel == 0) {
    return change.lhs
  }
  const numberOfEmptyWordBeforeDelete = numberOfemptyWordBetween(
    words,
    positionDel - 1,
    positionDel
  )

  if (
    numberOfEmptyWordBeforeDelete + numberWordsDeleted < numberWordsAdded &&
    positionDel < words.length
  ) {
    return {
      at: positionDel,
      del:
        numberWordsDeleted +
        numberOfEmptyWordBeforeDelete +
        numberOfemptyWordBetween(words, positionDel, positionDel + 1),
    }
  } else {
    return {
      at: positionDel,
      del: numberWordsDeleted + numberOfEmptyWordBeforeDelete,
    }
  }

  return {}
}

function generateID() {
  return process.env["TEST"] ? "id" : uuidv4()
}
