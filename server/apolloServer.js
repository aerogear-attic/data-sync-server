const { ApolloServer } = require('apollo-server-express')
const queryDepthLimit = require('graphql-depth-limit')
const { GraphQLError } = require('graphql')
const { createComplexityLimitRule } = require('graphql-validation-complexity')
const { log, auditLogEnabled, auditLog } = require('./lib/util/logger')

const NOOP = function () {
}

function newApolloServer (app, schema, httpServer, tracing, playgroundConfig, graphqlEndpoint, securityService, serverSecurity) {
  let AuthContextProvider = null

  if (securityService) {
    AuthContextProvider = securityService.getAuthContextProvider()
  }

  let apolloServer = new ApolloServer({
    schema,
    validationRules: [
      queryDepthLimit(serverSecurity.queryDepthLimit),
      createComplexityLimitRule(serverSecurity.complexityLimit, {
        createError (cost, documentNode) {
          const error = new GraphQLError(`query with ${cost} exceeds complexity limit`, [documentNode])
          log.debug(error)
          return error
        }
      })
    ],
    context: async ({ req }) => {
      const context = {
        request: req
      }
      if (AuthContextProvider) {
        context.auth = new AuthContextProvider(req)
      }
      if (auditLogEnabled) {
        // clientInfo is available in the request, decoded already
        // just attach it to context
        context.clientInfo = req.clientInfo
        context.auditLog = auditLog
      } else {
        context.clientInfo = undefined
        context.auditLog = NOOP
      }
      return context
    },
    tracing,
    playground: {
      settings: {
        'editor.theme': 'light',
        'editor.cursorShape': 'block'
      },
      tabs: [
        {
          endpoint: playgroundConfig.endpoint,
          query: playgroundConfig.query,
          variables: JSON.stringify(playgroundConfig.variables)
        }
      ]
    }
  })
  apolloServer.applyMiddleware({ app, disableHealthCheck: true, path: graphqlEndpoint })
  apolloServer.installSubscriptionHandlers(httpServer)

  return apolloServer
}

module.exports = newApolloServer
