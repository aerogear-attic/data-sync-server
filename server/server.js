const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const cors = require('cors')

const schemaParser = require('./lib/schemaParser')

module.exports = async ({ graphQLConfig, graphiqlConfig }, models) => {
  const { tracing } = graphQLConfig
  let schema

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
    include: [ models.DataSource ]
  })
  const resolversJson = resolvers.map((resolver) => {
    return resolver.toJSON()
  })

  try {
    schema = schemaParser(graphQLSchemaString, dataSourcesJson, resolversJson)
  } catch (ex) {
    console.error('Error while building configuration')
    console.error(ex)
    process.exit(1)
  }

  const app = express()

  app.use('*', cors())
  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema, tracing }))

  // TODO Move this to the Admin UI
  app.get('/graphiql', graphiqlExpress(graphiqlConfig))
  app.get('/healthz', (req, res) => res.sendStatus(200))

  // Wrap the Express server
  const server = http.createServer(app)
  return server
}
