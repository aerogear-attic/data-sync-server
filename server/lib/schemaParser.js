const { makeExecutableSchema } = require('graphql-tools')
const resolverMapper = require('./resolvers/resolverMapper')
const subscriptionsMapper = require('./subscriptions/subscriptionMapper')

module.exports = function (schemaString, dataSources, resolverMappingsJson, subscriptionMappingsJson, pubsub, schemaDirectives) {
  const subscriptionResolvers = subscriptionsMapper(subscriptionMappingsJson, pubsub)
  const dataResolvers = resolverMapper(dataSources, resolverMappingsJson, pubsub)

  const resolvers = {...subscriptionResolvers, ...dataResolvers}

  return makeExecutableSchema({
    typeDefs: [schemaString],
    resolvers: resolvers,
    schemaDirectives
  })
}
