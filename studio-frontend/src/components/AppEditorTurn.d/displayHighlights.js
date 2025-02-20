import { nextTick } from "vue"
import findExpressionInWordsList from "@/tools/findExpressionInWordsList.js"
import getWordsRangeFromTagMetadata from "@/tools/getWordsRangeFromTagMetadata"

export default async function displayHighlights() {
  // first unhighlight all
  await nextTick()
  await this.unHighlightAllText()

  this.highlightsRanges = {}
  // then highlight all
  for (let hightlightCat of this.hightlightsCategories) {
    let { tagsWithoutRangeMetadata, rangesFromMetadata } = divideTags(
      hightlightCat.tags
    )

    let rangesFromText = findExpressionInWordsList(
      tagsWithoutRangeMetadata,
      this.words.filter((w) => w.word !== ""),
      (k) => k.name,
      (w) => w.word
    )

    let domRanges = rangesFromText
      .map(this.plainRangeToDomRange)
      .concat(rangesFromMetadata.map(metadataRangeToDomRange)) //save it to don't compute it again

    this.highlightsRanges[hightlightCat._id] = {
      ranges: domRanges,
      category: hightlightCat,
    }
  }

  await this.hightlightAllText()
}

function divideTags(tags) {
  let tagsWithRangeMetadata = []
  let tagsWithoutRangeMetadata = []
  let rangesFromMetadata = []
  for (let tag of tags) {
    let ranges = getWordsRangeFromTagMetadata(tag)
    if (ranges.length > 0) {
      tagsWithRangeMetadata.push(tag)
      rangesFromMetadata = rangesFromMetadata.concat(
        ranges.map((r) => ({ ...r, tag }))
      )
    } else {
      tagsWithoutRangeMetadata.push(tag)
    }
  }
  return { tagsWithoutRangeMetadata, rangesFromMetadata }
}

function metadataRangeToDomRange(range) {
  try {
    let domRange = new Range()

    const startDomElement = document.getElementById(range.startId)
    const endDomElement = document.getElementById(range.endId)

    if (!startDomElement || !endDomElement) {
      return null
    }

    domRange.setStartBefore(startDomElement)
    domRange.setEndBefore(endDomElement)
    domRange._tag = range.tag
    return domRange
  } catch (e) {
    console.error(e)
    return null
  }
}
