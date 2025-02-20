import "./config.js"
import nunjucks from "nunjucks"
import express from "express"
import Users from "./models/user.js"
import Organizations from "./models/organisations.js"

let app = express()

let nunEnv = nunjucks.configure("src/views", {
  autoescape: true,
  express: app,
  trimBlocks: true,
  lstripBlocks: true,
})

nunEnv.addFilter("nl2br", function (str) {
  return str.replace(/\r|\n|\r\n/g, "<br />")
})

app.use(express.static("src/static"))

async function viewListUsers(req, res, selectedOrgId) {
  const orgs = await Organizations.getAll({ personal: false })

  let idsUsers = []
  if (selectedOrgId) {
    const selectedOrg = await Organizations.getOneById(selectedOrgId)
    idsUsers = selectedOrg ? selectedOrg.usersId : []
  }

  const page = parseInt(req.query.page) || 1
  const email = req.query.email
  const offset = (page - 1) * 10
  const { users, totalUsers, totalExternalUsers, convDuration, convCount } =
    await Users.getUsersAndStats(10, offset, email, idsUsers)
  const totalPage = Math.ceil(totalUsers / 10)

  res.render("index.html", {
    users,
    totalUsers,
    totalExternalUsers,
    convDuration,
    convCount,
    page,
    offset,
    totalPage,
    email,
    orgs,
    selectedOrgId,
  })
}

app.get("/", async function (req, res) {
  try {
    return await viewListUsers(req, res, null)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.get("/org/:id", async function (req, res) {
  try {
    const selectedOrgId = req.params.id || ""
    return await viewListUsers(req, res, selectedOrgId)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.get("/users/:id", async function (req, res) {
  try {
    const user = await Users.getOneById(req.params.id)
    if (user) {
      await user.fetchOwnedConversations()
      await user.fetchSharedWithConversations()
      res.render("userDetail.html", { user })
    } else {
      res.status(404).send("Not found")
    }
  } catch (error) {
    res.status(500).send(error.message)
  }
})

app.listen(process.env.WEBSERVER_HTTP_PORT)
console.log(
  `Back Office Dashboard Started`
)
