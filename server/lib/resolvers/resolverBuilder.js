const _ = require('lodash')
const resolverBuilders = require('./builders')
const { compileMappings } = require('./compiler')

module.exports = function (dataSources, resolverMappings) {
  const resolvers = {
    Query: {},
    Mutation: {},
    Subscription: {}
  }

  _.forEach(resolverMappings, (resolverMapping, resolverMappingName) => {
    if (_.isEmpty(resolverMapping.type)) {
      throw new Error('Missing query type for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.dataSource)) {
      throw new Error('Missing data source for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.requestMapping)) {
      throw new Error('Missing request mapping for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.responseMapping)) {
      throw new Error('Missing response mapping for mapping: ' + resolverMappingName)
    }

    if (!(resolverMapping.dataSource in dataSources)) {
      throw new Error('Unknown data source "' + resolverMapping.dataSource + '" for mapping ' + resolverMappingName)
    }

    let { type, client } = dataSources[resolverMapping.dataSource]
    let builder = resolverBuilders[type]

    if (builder) {
      try {
        const { compiledRequestMapping, compiledResponseMapping } = compileMappings(resolverMapping.requestMapping, resolverMapping.responseMapping)
        const resolver = builder.buildResolver(
          client,
          compiledRequestMapping,
          compiledResponseMapping
        )

        resolvers[resolverMapping.type] = resolvers[resolverMapping.type] || {}
        resolvers[resolverMapping.type][resolverMappingName] = resolver
      } catch (ex) {
        console.log(ex)
        console.log(`Error while building resolver of type ${type} for mapping: ${resolverMappingName}`)
        throw new Error(`Error while building resolver of type ${type} for mapping: ${resolverMappingName}`)
      }
    }
  })

  return resolvers
}
