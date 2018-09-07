const { ApolloServer } = require('apollo-server-express')
const queryDepthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')
const { log } = require('./lib/util/logger')

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
        formatErrorMessage: (cost) => {
          const errorMessage = `query with ${cost} exceeds complexity limit`
          log.warn(errorMessage)
          return errorMessage
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
