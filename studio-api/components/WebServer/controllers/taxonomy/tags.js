const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:controller:taxonomy:tags",
)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const TYPE = require(`${process.cwd()}/lib/dao/organization/categoryType`)

async function fetchTagData(tags, search) {
  let ignoredList = []
  let categoriesList = {}

  if (search.tags === undefined) search.tags = []
  else search.tags = search.tags.split(",")
  if (search.categories === undefined) search.categories = []

  for (let tag of tags) {
    if (ignoredList.includes(tag.categoryId)) continue // should skip if the category has already been ignored

    if (!categoriesList[tag.categoryId]) {
      let category = (await model.categories.getById(tag.categoryId))[0]
      if (
        search?.categoryType &&
        !TYPE.desiredType(category.type, search.categoryType)
      ) {
        ignoredList.push(tag.categoryId)
        continue // should skip if the category is not the desired type
      }
      categoriesList[tag.categoryId] = { ...category, tags: [] }
    }

    if (
      search.categories.includes(tag.categoryId) ||
      search.expand === "true"
    ) {
      categoriesList[tag.categoryId].tags.push(tag)
    } else if (search.tags.includes(tag._id.toString())) {
      categoriesList[tag.categoryId].tags.push(tag)
    } else if (categoriesList[tag.categoryId]) {
      categoriesList[tag.categoryId].tags.push(tag)
    }
  }

  let searchResult = []
  for (let categoryId in categoriesList) {
    searchResult.push(categoriesList[categoryId])
  }
  return searchResult
}

async function expandTags(tagsList, type) {
  let categories = {}
  for (let tag of tagsList) {
    if (!categories[tag.categoryId]) {
      let category = (await model.categories.getById(tag.categoryId))[0]
      if (category?.type === type || type === undefined) {
        categories[tag.categoryId] = { ...category, tags: [] }
      }
    }
    if (categories[tag.categoryId]) categories[tag.categoryId].tags.push(tag)
  }
  return Object.values(categories)
}

module.exports = { fetchTagData, expandTags }
