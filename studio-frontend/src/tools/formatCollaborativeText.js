export default function formatCollaborativeText(
  inputField,
  cursorPosition,
  lineIndex,
  enableMultiline
) {
  let numberOfSpaceToRemove
  let numberOfLineToRemove = 0
  let textWithoutDoubleSpace = ""

  if (enableMultiline) {
    let partialText = inputField.childNodes[lineIndex].innerText

    numberOfSpaceToRemove = (
      partialText.slice(0, cursorPosition).match(/[^\S\r\n]{2,}/g) || []
    ).reduce((acc, cur) => acc + cur.length - 1, 0)

    for (let i = 0; i < inputField.childNodes.length; i++) {
      let line = inputField.childNodes[i]

      let isLineEmpty = line.innerText === "\n" || line.innerText === ""

      switch (true) {
        case !isLineEmpty:
          let lineText = line.innerText
            .replace(/[^\S\r\n]{2,}/g, " ")
            .replace(/[\n\r]+/g, " ") // NOTE: not ideal but works
          textWithoutDoubleSpace += lineText + "\n"
          break
        case i < lineIndex:
          numberOfLineToRemove++
          break
        case i === lineIndex:
          textWithoutDoubleSpace += "\n"
          break
      }
    }

    if (textWithoutDoubleSpace !== "\n") {
      textWithoutDoubleSpace = textWithoutDoubleSpace.substring(
        0,
        textWithoutDoubleSpace.length - 1
      )
    }
  } else {
    let text = inputField.innerText
    numberOfSpaceToRemove = (
      text.slice(0, cursorPosition).match(/\s\s+/g) || []
    ).reduce((acc, cur) => acc + cur.length - 1, 0)

    textWithoutDoubleSpace = text.replace(/\s\s+/g, " ").replace(/[\n\r]/g, " ") //.trim()
  }

  return {
    formatedText: textWithoutDoubleSpace,
    lineIndex: lineIndex - numberOfLineToRemove,
    cursorPosition: cursorPosition - numberOfSpaceToRemove,
  }
}
