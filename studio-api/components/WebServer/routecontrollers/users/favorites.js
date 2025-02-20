const Mail = require("nodemailer/lib/mailer")

const debug = require("debug")(
  "linto:conversation-manager:components:WebServer:routecontrollers:users:favorite",
)
const model = require(`${process.cwd()}/lib/mongodb/models`)

const ORGANIZATION_ROLES = require(
  `${process.cwd()}/lib/dao/organization/roles`,
)

const { UserError } = require(
  `${process.cwd()}/components/WebServer/error/exception/users`,
)

const conversationUtility = require(
  `${process.cwd()}/components/WebServer/controllers/conversation/utility`,
)

async function addFav(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    const result = await model.favorites.add(
      req.payload.data.userId,
      req.params.conversationId,
    )

    if (result.modifiedCount === 0) res.status(304).send()
    else res.status(201).send({ message: "Conversation added to my favorites" })
  } catch (err) {
    next(err)
  }
}

async function deleteFav(req, res, next) {
  try {
    if (!req.params.conversationId) throw new ConversationIdRequire()
    const result = await model.favorites.deleteFav(
      req.payload.data.userId,
      req.params.conversationId,
    )

    if (result.modifiedCount === 0) res.status(304).send()
    else
      res
        .status(200)
        .send({ message: "Conversation deleted from my favorites" })
  } catch (err) {
    next(err)
  }
}

async function listFav(req, res, next) {
  try {
    const userFav = await model.favorites.listFav(req.payload.data.userId)
    if (userFav.length === 0) res.status(204).send()
    else {
      let conv_favorite = []
      for (let favId of userFav[0].favorites) {
        const conversation = await model.conversations.getById(favId)
        if (conversation.length !== 1)
          await model.favorites.deleteFav(req.payload.data.userId, favId)
        else {
          let conv = await conversationUtility.userAccess(
            req.payload.data.userId,
            favId,
            ORGANIZATION_ROLES.MEMBER,
          )
          // if access to the covnersation have been removed from the user we delete the conversation from the user favorite
          if (conv) conv_favorite.push(conv._id)
          else await model.favorites.deleteFav(req.payload.data.userId, favId)
        }
      }
      let fav_conv = await model.conversations.listConvFromFavorite(
        conv_favorite,
        req.query,
      )
      fav_conv.list = await conversationUtility.getUserRightByShare(
        req.payload.data.userId,
        fav_conv.list,
      )

      res.status(200).send(fav_conv)
    }
  } catch (err) {
    next(err)
  }
}

async function listFavTags(req, res, next) {
  try {
    const userFav = await model.favorites.listFav(req.payload.data.userId)
    if (userFav.length === 0) res.status(204).send()
    else {
      let listConv = await model.search.conversations.getByIdsAndTag(
        userFav[0].favorites,
        req.query.tags,
      )
      let tags = []
      let categories = {}

      listConv.map((conv) => conv.tags.map((tag) => tags.push(tag)))
      const uniqueTagsList = [...new Set(tags)]
      const tags_list = await model.tags.getByIdList(uniqueTagsList)

      for (const tag of tags_list) {
        const categoryId = tag.categoryId

        if (!categories[categoryId]) {
          const category = (await model.categories.getById(categoryId))[0]
          if (category === undefined) continue
          categories[categoryId] = {
            ...category,
            tags: [],
          }
        }
        categories[categoryId].tags.push(tag)
      }

      let searchResult = []
      for (const categoryId in categories) {
        searchResult.push(categories[categoryId])
      }

      if (searchResult.length === 0) res.status(204).send()
      else res.status(200).send(searchResult)
    }
  } catch (err) {
    next(err)
  }
}

module.exports = {
  addFav,
  deleteFav,
  listFav,
  listFavTags,
}
