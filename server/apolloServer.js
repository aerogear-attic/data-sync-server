const { ApolloServer } = require('apollo-server-express')

function newApolloServer (app, schema, httpServer, tracing, playgroundConfig, graphqlEndpoint, securityService) {
  let AuthContextProvider = null

  if (securityService) {
    AuthContextProvider = securityService.getAuthContextProvider()
  }

  let apolloServer = new ApolloServer({
    schema,
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
