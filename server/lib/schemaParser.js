const graphqlTools = require('graphql-tools')

const dataSourceParser = require('./datasources/dataSourceParser')
const resolverMapper = require('./resolvers/resolverMapper')
const subscriptionsMapper = require('./subscriptions/subscriptionMapper')

const PubSub = require('./pubsubNotifiers').InMemory

module.exports = function (schemaString, dataSourcesJson, resolverMappingsJson, subscriptionMappingsJson) {
  const pubsub = PubSub()

  const dataSources = dataSourceParser(dataSourcesJson)
  const subscriptionResolvers = subscriptionsMapper(subscriptionMappingsJson, pubsub) // { Subscriptions: {}}
  const dataResolvers = resolverMapper(dataSources, resolverMappingsJson, pubsub)

  const resolvers = {...subscriptionResolvers, ...dataResolvers}

  const schema = graphqlTools.makeExecutableSchema({
    typeDefs: [schemaString],
    resolvers: resolvers
  })

  return {schema, dataSources}
}
