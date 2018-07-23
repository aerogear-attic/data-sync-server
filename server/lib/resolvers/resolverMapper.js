const _ = require('lodash')
const resolverBuilders = require('./builders')
const { compile } = require('./compiler')
const { log } = require('../util/logger')

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

    if (builder) {
      const compiledRequestMapping = compile(resolverMapping.requestMapping)
      const compiledResponseMapping = compile(resolverMapping.responseMapping)
      if (builder.buildResolver && typeof builder.buildResolver === 'function') {
        
        const builtResolver = builder.buildResolver(
          dataSource,
          compiledRequestMapping,
          compiledResponseMapping
        )

        let resolver = builtResolver

        // If a publish option is specified we wrap the resolver function
        if (resolverMapping.publish) {
          const { topic, payload } = resolverMapping.publish

          const publishOpts = {
            pubsub,
            topic,
            compiledPayload: compile(payload)
          }
          // Build a wrapper function around the resolver
          // This wrapper function will run the resolver
          // And also publish a notification
          resolver = resolveAndPublish(builtResolver, publishOpts)
        }

        resolvers[resolverMapping.type] = resolvers[resolverMapping.type] || {}
        resolvers[resolverMapping.type][resolverMappingName] = resolver
      } else {
        throw new Error(`Resolver builder for ${dataSource.type} missing buildResolver function`)
      }
    } else {
      throw new Error(`No resolver builder for type: ${dataSource.type}`)
    }
  })

  return resolvers
}

function resolveAndPublish (resolverFn, publishOpts) {
  return (obj, args, context, info) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await resolverFn(obj, args, context, info)
        resolve(result)

        const { pubsub, topic, compiledPayload } = publishOpts

        let compileOpts = {
          context: {
            result: result
          }
        }

        let payload = compiledPayload(compileOpts)

        // The InMemory pubsub implementation wants an object
        // Whereas the postgres one would expect a string
        if (pubsub.type === 'InMemory') {
          payload = JSON.parse(payload)
        }

        log.info('publishing to topic', { topic, payload })

        pubsub.client.publish(topic, payload)
      } catch (error) {
        reject(error)
      }
    })
  }
}
