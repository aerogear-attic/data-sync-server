const graphqlTools = require('graphql-tools')

const dataSourceParser = require('./datasources/dataSourceParser')
const resolverMapper = require('./resolvers/resolverMapper')

module.exports = function (schemaString, dataSourcesJson, resolverMappingsJson) {
  const dataSources = dataSourceParser(dataSourcesJson)
  const resolvers = resolverMapper(dataSources, resolverMappingsJson)

  const schema = graphqlTools.makeExecutableSchema({
    typeDefs: [schemaString],
    resolvers: resolvers
  })

  return {schema, dataSources}
}
