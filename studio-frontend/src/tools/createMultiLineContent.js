export default function createMultiLineContent(text) {
  let textLines = text.split("\n")
  let lines = []

  for (let line of textLines) {
    let elem = document.createElement("div")
    elem.innerText = line === "" ? "\n" : line
    lines.push(elem)
  }

  return lines
}
