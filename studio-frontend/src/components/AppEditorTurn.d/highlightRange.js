import Vue, { h } from "vue"
import AppEditorHighlightDescToolbox from "@/components/AppEditorHighlightDescToolbox.vue"

export default async function highlightRange(
  { range, category },
  { functionToHighlightWord = highlightWord, functionArgs = [] } = {}
) {
  // AppEditorHighlightDescToolbox
  const color = category.color || "yellow"
  let toolboxComponent = null

  let { startContainer, endContainer, startOffset, endOffset } = range

  let startWord = startContainer.children.item(startOffset)
  let endWord = endContainer.children.item(endOffset)
  let isFirstWord = true
  //console.log("start", startWord, "end", endWord)
  if (!endWord || startWord === endWord) {
    functionToHighlightWord(
      startWord,
      color,
      range,
      category,
      this.$i18n,
      { isLastWord: true, isFirstWord: true },
      ...functionArgs
    )
    startWord.setAttribute("highlighted--last-word", "true")
  } else {
    do {
      functionToHighlightWord(
        startWord,
        color,
        range,
        category,
        this.$i18n,
        { isLastWord: false, isFirstWord },
        ...functionArgs
      )
      isFirstWord = false
      startWord = startWord.nextSibling
    } while (startWord !== endWord)
    functionToHighlightWord(
      endWord,
      color,
      range,
      category,
      this.$i18n,
      { isLastWord: true, isFirstWord: false },
      ...functionArgs
    )
  }

  //highlightWord(startWord, color, range, category, isFromHighlight, this.$i18n)
}

function highlightWord(
  word,
  color,
  range,
  category,
  i18n,
  { isLastWord = false, isFirstWord = false } = {},
  isFromHighlight = true
) {
  const wordHasToolbox = word.querySelector(".conversation-highlight-toolbox")

  word.setAttribute("highlighted", "true")
  word.classList.add(`background-${color}-100`)

  if (isLastWord) {
    word.setAttribute("highlighted--last-word", "true")
  }

  if (isFirstWord) {
    word.setAttribute("highlighted--first-word", "true")
  }

  let toolboxDiv = document.createElement("div")
  toolboxDiv.style.display = "inline"
  word.appendChild(toolboxDiv)
  if (isFromHighlight && !wordHasToolbox) {
    var toolbox = Vue.extend(AppEditorHighlightDescToolbox)
    // find how to listen to the event, workaround for now is to use the global event bus
    new toolbox({
      i18n,
      propsData: {
        tag: range._tag,
        category,
      },
    }).$mount(toolboxDiv)
  }
}
