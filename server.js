const express = require('express')
const bodyParser = require('body-parser')
const graphqlExpress = require('apollo-server-express').graphqlExpress
const graphql = require('graphql')
const http = require('http')
const SubscriptionServer = require('subscriptions-transport-ws').SubscriptionServer
const app = express()

const HTTP_PORT = process.env.HTTP_PORT || '8000'

const SCHEMA_FILE = process.env.SCHEMA_FILE
if (SCHEMA_FILE == null || SCHEMA_FILE.length === 0) {
  console.error('SCHEMA_FILE not defined')
  process.exit(1)
}
const schema = require('./lib/schemaParser').parseFromFile(SCHEMA_FILE)

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))

// Wrap the Express server
const ws = http.createServer(app)

ws.listen(HTTP_PORT, () => {
  console.log(`Server is now running on http://localhost:${HTTP_PORT}`)
  // Set up the WebSocket for handling GraphQL subscriptions
  // eslint-disable-next-line
  new SubscriptionServer({
    execute: graphql.execute,
    subscribe: graphql.subscribe,
    schema
  }, {
    server: ws,
    path: '/subscriptions'
  })
})
