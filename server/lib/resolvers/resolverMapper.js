const _ = require('lodash')
const resolverBuilders = require('./builders')
const { compile } = require('./compiler')
const { wrapResolverWithPublish } = require('./wrapResolverWithPublisher')

module.exports = function (dataSources, resolverMappings, pubsub) {
  const resolvers = {}

  _.forEach(resolverMappings, (resolverMapping) => {
    const resolverMappingName = resolverMapping.field

    if (_.isEmpty(resolverMapping.type)) {
      throw new Error('Missing query type for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.DataSource)) {
      throw new Error('Missing data source for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.requestMapping)) {
      throw new Error('Missing request mapping for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.responseMapping)) {
      throw new Error('Missing response mapping for mapping: ' + resolverMappingName)
    }

    if (!(resolverMapping.DataSource.name in dataSources)) {
      throw new Error('Unknown data source "' + resolverMapping.DataSource.name + '" for mapping ' + resolverMappingName)
    }

    let dataSource = dataSources[resolverMapping.DataSource.name]
    let builder = resolverBuilders[dataSource.type]

    if (!builder) {
      throw new Error(`No resolver builder for type: ${dataSource.type}`)
    }

    if (!builder.buildResolver || typeof builder.buildResolver !== 'function') {
      throw new Error(`Resolver builder for ${dataSource.type} missing buildResolver function`)
    }

    const compiledRequestMapping = compile(resolverMapping.requestMapping)
    const compiledResponseMapping = compile(resolverMapping.responseMapping)

    // This is the actual resolver function
    let resolver = builder.buildResolver(
      dataSource,
      compiledRequestMapping,
      compiledResponseMapping,
      resolverMapping
    )

    // If a publish option is specified we wrap the resolver function
    if (resolverMapping.publish && !_.isEmpty(resolverMapping.publish)) {
      resolver = wrapResolverWithPublish(resolver, resolverMapping, pubsub)
    }

    resolvers[resolverMapping.type] = resolvers[resolverMapping.type] || {}
    resolvers[resolverMapping.type][resolverMappingName] = resolver
  })

  return resolvers
}
