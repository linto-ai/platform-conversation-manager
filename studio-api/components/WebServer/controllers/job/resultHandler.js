const debug = require("debug")(
  "linto:components:WebServer:controller:resultHandler",
)

const SttWrapper = require(
  `${process.cwd()}/components/WebServer/controllers/conversation/generator`,
)
const { segmentNormalizeText } = require(
  `${process.cwd()}/components/WebServer/controllers/conversation/normalizeSegment`,
)

const JOBS = require(`${process.cwd()}/lib/dao/conversation/jobs.js`)
const model = require(`${process.cwd()}/lib/mongodb/models`)

async function handleResult(result, job, conversation) {
  if (result && job.type === JOBS.TRANSCRIPTION)
    await handleTranscriptionResult(result, conversation)
  else if (result && job.type === JOBS.KEYWORD)
    await handleKeywordResult(result, conversation)
}

async function handleKeywordResult(result, conversation) {
  const category = await model.categories.searchByScopeAndName(
    conversation._id.toString(),
    "keyword",
  )
  let categoryId = ""

  if (category.length === 0) {
    let result = await model.categories.createDefaultCategories(
      "keyword",
      conversation._id.toString(),
    )
    categoryId = result.insertedId.toString()
  } else if (category.length === 1) categoryId = category[0]._id.toString()
  else throw new Error("Multiple category found for the same scope")

  let tagList = conversation.tags || []
  for (let i in result.keyword_extraction) {
    const keys = Object.keys(result.keyword_extraction[i])

    for (let i in keys) {
      let key = keys[i]
      const tag = await model.tags.getTagByCategoryAndName(categoryId, {
        name: key,
      })
      if (tag.length === 0) {
        //if probability is higher than 0.6
        let result = await model.tags.create({
          name: key,
          categoryId: categoryId,
        })
        tagList.push(result.insertedId.toString())
      } else if (tag.length > 0) {
        tagList.push(tag[0]._id.toString())
      }
    }
  }
  // remove duplicate or null value from tagList
  tagList = tagList.filter(
    (item, index) => tagList.indexOf(item) === index && item !== null,
  )
  await model.conversations.updateTag(conversation._id, tagList)
}

async function handleTranscriptionResult(result, conversation) {
  conversation.text = [] // Force a refresh in case of multiple spam of requested result
  const normalizeTranscription = segmentNormalizeText(
    result,
    conversation.locale,
    conversation.metadata.normalize.filter,
  )

  conversation = SttWrapper.transcriptionToConversation(
    normalizeTranscription,
    conversation,
  )
  await model.conversations.updateConvOnTranscriptionResult(
    conversation._id.toString(),
    conversation,
  )
}

module.exports = { handleResult }
