const debug = require("debug")("linto:app:webserver:router")

const auth_middlewares = require(`../config/passport/local/middleware`)
const logger_middlewares = require(
  `${process.cwd()}/components/WebServer/middlewares/logger/logger.js`,
)
const conversation_middlewares = require(
  `${process.cwd()}/components/WebServer/middlewares/access/conversation.js`,
)
const organization_middlewares = require(
  `${process.cwd()}/components/WebServer/middlewares/access/organization.js`,
)
const taxonomy_middlewares = require(
  `${process.cwd()}/components/WebServer/middlewares/access/taxonomy.js`,
)
const user_middlewares = require(
  `${process.cwd()}/components/WebServer/middlewares/access/user.js`,
)

const platform_middlewares = require(
  `${process.cwd()}/components/WebServer/middlewares/access/platform.js`,
)

const PERMISSIONS = require(`${process.cwd()}/lib/dao/organization/permissions`)

const permissionMiddlewareMap = {
  [PERMISSIONS.UPLOAD]: organization_middlewares.permissionUpload,
  [PERMISSIONS.SUMMARY]: organization_middlewares.permissionSummary,
  [PERMISSIONS.SESSION]: organization_middlewares.permissionSession,
}

const {
  createProxyMiddleware,
  fixRequestBody,
  responseInterceptor,
} = require("http-proxy-middleware")

const ifHasElse = (condition, ifHas, otherwise) => {
  return !condition ? otherwise() : ifHas()
}

const disableAuthIfDev = (route) => {
  if (process.env.DEV_DISABLE_AUTH === "true") {
    route.requireAuth = false
    route.requireConversationCommentAccess = false
    route.requireConversationDeleteAccess = false
    route.requireConversationReadAccess = false
    route.requireConversationShareAccess = false
    route.requireConversationWriteAccess = false
    route.requireDeleteTaxonomyAccess = false
    route.requireOrganizationAdminAccess = false
    route.requireOrganizationGuestAccess = false
    route.requireOrganizationMaintainerAccess = false
    route.requireOrganizationMemberAccess = false
    route.requireOrganizationUploaderAccess = false
    route.requireReadTaxonomyAccess = false
    route.requireSession = false
    route.requireUserVisibility = false
    route.requireWriteTaxonomyAccess = false
  }
}

const loadMiddlewares = (route) => {
  const middlewares = []

  if (route.requireAuth) middlewares.push(auth_middlewares.isAuthenticate)
  if (route.requireRefresh) middlewares.push(auth_middlewares.refresh_token)

  if (route.requireSuperAdmin)
    middlewares.push(platform_middlewares.isPlatformAdmin)
  if (route.requireSystemAdministrator)
    middlewares.push(platform_middlewares.isPlatformSystemAdministrator)
  if (route.requireSessionOperator)
    middlewares.push(platform_middlewares.isPlatformSessionOperator)
  if (route.requireOrganizationInitiatorAccess)
    middlewares.push(platform_middlewares.isPlatformOrganizationInitiator)

  if (route.requireConversationReadAccess)
    middlewares.push(conversation_middlewares.asReadAccess)
  if (route.requireConversationCommentAccess)
    middlewares.push(conversation_middlewares.asCommentAccess)
  if (route.requireConversationWriteAccess)
    middlewares.push(conversation_middlewares.asWriteAccess)
  if (route.requireConversationDeleteAccess)
    middlewares.push(conversation_middlewares.asDeleteAccess)
  if (route.requireConversationShareAccess)
    middlewares.push(conversation_middlewares.asShareAccess)

  if (route.requireOrganizationAdminAccess)
    middlewares.push(organization_middlewares.asAdminAccess)
  if (route.requireOrganizationMaintainerAccess)
    middlewares.push(organization_middlewares.asMaintainerAccess)
  if (route.requireOrganizationMeetingManagerAccess)
    middlewares.push(organization_middlewares.asMeetingManagerAccess)
  if (route.requireOrganizationQuickMeetingAccess)
    middlewares.push(organization_middlewares.asQuickMeetingAccess)
  if (route.requireOrganizationUploaderAccess)
    middlewares.push(organization_middlewares.asUploaderAccess)
  if (route.requireOrganizationMemberAccess)
    middlewares.push(organization_middlewares.asMemberAccess)

  if (route.requireReadTaxonomyAccess)
    middlewares.push(taxonomy_middlewares.asReadTaxonomyAccess)
  if (route.requireWriteTaxonomyAccess)
    middlewares.push(taxonomy_middlewares.asWriteTaxonomyAccess)
  if (route.requireDeleteTaxonomyAccess)
    middlewares.push(taxonomy_middlewares.asDeleteTaxonomyAccess)

  if (route.orgaPermissionAccess !== undefined) {
    Object.keys(permissionMiddlewareMap).forEach((permission) => {
      const permissionValue = parseInt(permission)
      if ((route.orgaPermissionAccess & permissionValue) === permissionValue) {
        const desiredMiddleware = permissionMiddlewareMap[permissionValue]
        if (desiredMiddleware) middlewares.push(desiredMiddleware)
      }
    })
  }

  if (route.requireUserVisibility)
    middlewares.push(user_middlewares.isVisibility)

  if (process.env.LOGGER_ENABLED === "true")
    middlewares.push(nav_middlewares.logger)

  return middlewares
}

class Router {
  constructor(webServer) {
    const routes = require("./routes.js")(webServer)

    createApiRoutes(webServer, routes.api_routes)

    if (routes.proxy_routes.length > 0) {
      createProxyRoutes(webServer, routes.proxy_routes)
    }
  }
}

const createApiRoutes = (webServer, api_routes) => {
  for (let level in api_routes) {
    for (let path in api_routes[level]) {
      const route = api_routes[level][path]

      const methods = route.method.split(",")
      const path_ = route.path.split(",")

      disableAuthIfDev(route)

      const middlewares = loadMiddlewares(route)

      methods.map((method) => {
        path_.map((path) => {
          webServer.express[method](
            level + path,
            middlewares,
            logger_middlewares.logger,

            (req, res, next) => {
              next()
            },
            ifHasElse(
              Array.isArray(route.controller),
              () => Object.values(route.controller),
              () => route.controller,
            ),
          )
        })
      })
    }
  }
}

const createProxyRoutes = (webServer, proxy_routes) => {
  proxy_routes.forEach((proxy) => {
    const serviceHost = proxy.proxyHost
    const basePath = proxy.basePath

    proxy.proxyPaths.forEach((proxyPath) => {
      if (proxyPath.disabled) return

      const middlewares = loadMiddlewares(proxyPath)

      proxyPath.paths.forEach((path) => {
        //we alter req.payload, req.params, req.query, req.body if require
        path.method.forEach((method) => {
          const proxy = createProxyMiddleware({
            target: serviceHost,
            selfHandleResponse: true, // We want to handle the response ourselves

            changeOrigin: true,
            on: {
              proxyReq: fixRequestBody,
              proxyRes: responseInterceptor(
                async (responseBuffer, proxyRes, req, res) => {
                  try {
                    if (path.executeAfterResult) {
                      let result

                      for (let proxyAfterFunction of path.executeAfterResult) {
                        const buffer = Buffer.from(responseBuffer, "utf-8")
                        const jsonString = buffer.toString("utf-8")
                        result = await proxyAfterFunction(jsonString)
                      }
                      return result.toString()
                    } else {
                      return responseBuffer
                    }
                  } catch (error) {
                    return responseBuffer
                  }
                },
              ),
            },
            pathRewrite: (path, req) => {
              let newPath = path.replace(basePath, "")
              if (proxyPath.rewrite) {
                newPath = newPath.replace(
                  proxyPath.rewrite.fromPath,
                  proxyPath.rewrite.toPath,
                )
              }

              if (proxyPath.scrapPath) {
                const [pathWithoutQuery, query] = newPath.split("?")
                let updatedPath = pathWithoutQuery.replace(
                  proxyPath.scrapPath,
                  "",
                )
                newPath = query ? `${updatedPath}?${query}` : updatedPath
              }

              const queryParams = new URLSearchParams(req.query)
              const uniqueParams = {}
              for (const [key, value] of queryParams.entries())
                uniqueParams[key] = value

              const cleanedQuery = new URLSearchParams(uniqueParams).toString()
              if (cleanedQuery)
                newPath = `${newPath.split("?")[0]}?${cleanedQuery}`

              return newPath
            },
            onProxyReq: (proxyReq, req, res) => {
              // If the body is already parsed and present, need to re-write it to the proxy request
              if (req.body) {
                const bodyData = JSON.stringify(req.body)
                proxyReq.setHeader(
                  "Content-Length",
                  Buffer.byteLength(bodyData),
                )
                proxyReq.setHeader("Content-Type", "application/json")
                proxyReq.write(bodyData)
              }
            },
            onProxyRes: (proxyRes, req, res) => {
              let responseData = ""
              proxyRes.on("data", (chunk) => {
                responseData += chunk
              })
              proxyRes.on("end", () => {
                res.setHeader("Content-Type", "application/json")
                res.send(responseData)
              })
            },
            onError: (err, req, res) => {
              debug("Proxy error:", err)
              res
                .status(500)
                .json({ error: "Proxy error", details: err.message })
            },
            logLevel: "debug",
          })

          debug(`Proxying ${method} ${basePath + path.path} to ${serviceHost}`)
          webServer.express[method](
            basePath + path.path,
            middlewares,
            (req, res, next) => {
              if (path.executeBeforeResult) {
                path.executeBeforeResult(req, next)
              } else next()
            },
            (req, res, next) => {
              addProxyParams(req, path)
              proxy(req, res, next)
            },
          )
        })
      })
    })
  })
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj)
}

// Helper function to set nested value
function setNestedValue(obj, path, value) {
  const parts = path.split(".")
  const last = parts.pop()
  const target = parts.reduce((acc, part) => (acc[part] = acc[part] || {}), obj)
  target[last] = value
}

// Middleware function
function addProxyParams(req, path) {
  try {
    if (path.forwardParams !== undefined) {
      path.forwardParams.forEach((param) => {
        const [targetPath, sourcePath] = Object.entries(param)[0]
        const sourceValue = getNestedValue(req, sourcePath)
        if (sourceValue !== undefined) {
          setNestedValue(req, targetPath, sourceValue)
        }
      })
    }

    if (path.addParams !== undefined) {
      path.addParams.forEach((param) => {
        const [targetPath, value] = Object.entries(param)[0]
        setNestedValue(req, targetPath, value)
      })
    }
  } catch (err) {
    debug(err)
  }
}
module.exports = (webServer) => new Router(webServer)
