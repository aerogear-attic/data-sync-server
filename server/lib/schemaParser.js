const { makeExecutableSchema } = require('graphql-tools')
const dataSourceParser = require('./datasources/dataSourceParser')
const resolverMapper = require('./resolvers/resolverMapper')
const subscriptionsMapper = require('./subscriptions/subscriptionMapper')

const HasRoleDirective = require('./schemaDirectives/hasRole')

module.exports = function (schemaString, dataSourcesJson, resolverMappingsJson, subscriptionMappingsJson, pubsub) {
  const dataSources = dataSourceParser(dataSourcesJson)
  const subscriptionResolvers = subscriptionsMapper(subscriptionMappingsJson, pubsub)
  const dataResolvers = resolverMapper(dataSources, resolverMappingsJson, pubsub)

  const resolvers = {...subscriptionResolvers, ...dataResolvers}

  const schema = makeExecutableSchema({
    typeDefs: [schemaString],
    resolvers: resolvers,
    schemaDirectives: {
      hasRole: HasRoleDirective
    }
  })

  return {schema, dataSources}
}
