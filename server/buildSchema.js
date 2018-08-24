const _ = require('lodash')

const schemaParser = require('./lib/schemaParser')
const emptySchemaString = require('./lib/util/emptySchema')
const { log } = require('./lib/util/logger')

async function buildSchema (models, pubsub, schemaDirectives) {
  const graphQLSchemas = await models.GraphQLSchema.findAll()
  let graphQLSchemaString = null

  if (!_.isEmpty(graphQLSchemas)) {
    for (let graphQLSchema of graphQLSchemas) {
      if (graphQLSchema.name === 'default') {
        graphQLSchemaString = graphQLSchema.schema
        break
      }
    }
    if (!graphQLSchemaString) {
      // only fail when there are schemas defined but there's none with the name 'default'
      // things should work fine when there's no schema at all
      throw new Error('No schema with name "default" found.')
    }
  }

  let dataSourcesJson = await models.DataSource.findAll({raw: true})
  const subscriptionsJson = await models.Subscription.findAll({raw: true})

  const resolvers = await models.Resolver.findAll({
    include: [models.DataSource]
  })
  let resolversJson = resolvers.map((resolver) => {
    return resolver.toJSON()
  })

  if (_.isEmpty(graphQLSchemaString) || _.isEmpty(dataSourcesJson) || _.isEmpty(resolversJson)) {
    log.warn('At least one of schema, dataSources or resolvers is missing. Using noop defaults')
    graphQLSchemaString = emptySchemaString
    resolversJson = dataSourcesJson = {}
  }

  try {
    return schemaParser(graphQLSchemaString, dataSourcesJson, resolversJson, subscriptionsJson, pubsub, schemaDirectives)
  } catch (error) {
    log.error('Error while building schema.')
    log.error(error)
    throw (error)
  }
}

module.exports = buildSchema
