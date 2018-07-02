const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express')
const cors = require('cors')

const schemaParser = require('./lib/schemaParser')

module.exports = function ({ graphQLConfig, graphiqlConfig }) {
  const { schemaFile, dataSourcesFile, resolverMappingsFile, tracing } = graphQLConfig
  
  try {
    schema = schemaParser(schemaFile, dataSourcesFile, resolverMappingsFile)
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

  // Wrap the Express server
  const server = http.createServer(app)
  return server
}
