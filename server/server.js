const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express')
const cors = require('cors')

const schemaParser = require('./lib/schemaParser')
const schemaListenerCreator = require('./lib/schemaListeners/schemaListenerCreator')

module.exports = async ({graphQLConfig, graphiqlConfig, postgresConfig, schemaListenerConfig}, models) => {
  const {tracing} = graphQLConfig
  let schema = await buildSchema(models)

  const app = express()

  app.use('*', cors())
  app.use('/graphql', bodyParser.json(), function (req, res, next) {
    const graphql = graphqlExpress({schema, tracing})
    return graphql(req, res, next)
  })

  // TODO Move this to the Admin UI
  app.get('/graphiql', graphiqlExpress(graphiqlConfig))

  schemaListenerCreator(schemaListenerConfig, async () => {
    console.log('Received schema change notification. Rebuilding it')
    schema = await buildSchema(models)
  })

  // Wrap the Express server
  const server = http.createServer(app)
  return server
}

async function buildSchema (models) {
  const graphQLSchema = await models.GraphQLSchema.findOne()
  // TODO: how to handle no shcema when using hot schema
  //       so the server gracefully starts
  let graphQLSchemaString = '{}'
  if (graphQLSchema != null) {
    graphQLSchemaString = graphQLSchema.schema
  }

  const dataSources = await models.DataSource.findAll()
  const dataSourcesJson = dataSources.map((dataSource) => {
    return dataSource.toJSON()
  })

  const resolvers = await models.Resolver.findAll({
    include: [models.DataSource]
  })
  const resolversJson = resolvers.map((resolver) => {
    return resolver.toJSON()
  })

  try {
    return schemaParser(graphQLSchemaString, dataSourcesJson, resolversJson)
  } catch (ex) {
    console.error('Error while building schema.')
    console.error(ex)
    throw new Error('Error while building schema.')
  }
}
