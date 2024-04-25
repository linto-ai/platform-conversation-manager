const debug = require('debug')('linto:app:webserver:router')

const auth_middlewares = require(`../config/passport/local/middleware`)
const conversation_middlewares = require(`${process.cwd()}/components/WebServer/middlewares/access/conversation.js`)
const organization_middlewares = require(`${process.cwd()}/components/WebServer/middlewares/access/organization.js`)
const taxonomy_middlewares = require(`${process.cwd()}/components/WebServer/middlewares/access/taxonomy.js`)

const user_middlewares = require(`${process.cwd()}/components/WebServer/middlewares/access/user.js`)

const ifHasElse = (condition, ifHas, otherwise) => {
    return !condition ? otherwise() : ifHas()
}
class Router {
    constructor(webServer) {
        const routes = require('./routes.js')(webServer)
        for (let level in routes) {
            for (let path in routes[level]) {
                const route = routes[level][path]
                const methods = route.method.split(',')
                const path_ = route.path.split(',')

                if (process.env.DEV_DISABLE_AUTH === 'true') {
                    route.requireAuth = false
                    route.requireSession = false
                    route.requireConversationReadAccess = false
                    route.requireConversationWriteAccess = false
                    route.requireOrganizationAdminAccess = false
                    route.requireOrganizationMaintainerAccess = false
                    route.requireOrganizationMemberAccess = false
                    route.requireOrganizationGuestAccess = false
                    route.requireUserVisibility = false
                }

                //debug('Create route : ' + route.method + ' - ' + level + route.path)
                let middlewaresLoaded = []
                // require passport auth (headers)
                if (route.requireAuth) middlewaresLoaded.push(auth_middlewares.isAuthenticate)
                if (route.requireRefresh) middlewaresLoaded.push(auth_middlewares.refresh_token)

                // Conversation rights
                if (route.requireConversationReadAccess) middlewaresLoaded.push(conversation_middlewares.asReadAccess) // require read access
                if (route.requireConversationCommentAccess) middlewaresLoaded.push(conversation_middlewares.asCommentAccess) // require comment access
                if (route.requireConversationWriteAccess) middlewaresLoaded.push(conversation_middlewares.asWriteAccess) // require write access
                if (route.requireConversationDeleteAccess) middlewaresLoaded.push(conversation_middlewares.asDeleteAccess) // require delete access
                if (route.requireConversationShareAccess) middlewaresLoaded.push(conversation_middlewares.asShareAccess) // require share access
                if (route.requireConversationMultipleShareAccess) middlewaresLoaded.push(conversation_middlewares.asShareMultipleAccess) // require multiple share access


                // Organization rights
                if (route.requireOrganizationAdminAccess) middlewaresLoaded.push(organization_middlewares.asAdminAccess)
                if (route.requireOrganizationMaintainerAccess) middlewaresLoaded.push(organization_middlewares.asMaintainerAccess)
                if (route.requireOrganizationUploaderAccess) middlewaresLoaded.push(organization_middlewares.asUploaderAccess)
                if (route.requireOrganizationMemberAccess) middlewaresLoaded.push(organization_middlewares.asMemberAccess)

                // Taxonomy rights
                if (route.requireReadTaxonomyAccess) middlewaresLoaded.push(taxonomy_middlewares.asReadTaxonomyAccess)
                if (route.requireWriteTaxonomyAccess) middlewaresLoaded.push(taxonomy_middlewares.asWriteTaxonomyAccess)
                if (route.requireDeleteTaxonomyAccess) middlewaresLoaded.push(taxonomy_middlewares.asDeleteTaxonomyAccess)

                // User visibility
                if (route.requireUserVisibility) middlewaresLoaded.push(user_middlewares.isVisibility)

                if (process.env.LOGGER_ENABLED === "true") middlewaresLoaded.push(nav_middlewares.logger)


                methods.map(method => {
                    path_.map(path => {
                        webServer.express[method](
                            level + path,
                            middlewaresLoaded,
                            (req, res, next) => {
                                next();
                            },
                            ifHasElse(
                                Array.isArray(route.controller),
                                () => Object.values(route.controller),
                                () => route.controller
                            )
                        )
                    })
                })

            }
        }
    }
}


module.exports = webServer => new Router(webServer)