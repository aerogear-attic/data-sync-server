const _ = require('lodash')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express')
const cors = require('cors')
const {log} = require('./lib/util/logger')
const expressPino = require('express-pino-logger')({logger: log})
const {runHealthChecks} = require('./health')

const schemaParser = require('./lib/schemaParser')
const schemaListenerCreator = require('./lib/schemaListeners/schemaListenerCreator')

module.exports = async ({graphQLConfig, graphiqlConfig, postgresConfig, schemaListenerConfig}, models) => {
  const {tracing} = graphQLConfig
  let {schema, dataSources} = await buildSchema(models)
  await connectDataSources(dataSources)

  const app = express()

  app.use('*', cors())
  app.use(expressPino)

  app.use('/graphql', bodyParser.json(), function (req, res, next) {
    const graphql = graphqlExpress({schema, tracing})
    return graphql(req, res, next)
  })

  // TODO Move this to the Admin UI
  app.get('/graphiql', graphiqlExpress(graphiqlConfig))

  app.get('/healthz', async (req, res) => {
    const result = await runHealthChecks(models)
    if (!result.ok) {
      res.status(503)
    }
    res.json(result)
  })

  const schemaListener = schemaListenerCreator(schemaListenerConfig)
  if (schemaListener) {
    // "onReceive" will cause the server to reload the configuration which could be costly.
    // don't allow doing it too often!
    // we debounce the "onReceive" callback here to make sure it is debounced
    // for all listener implementations.
    // that means, the callback will be executed after the system waits until there
    // is no request to call it for N milliseconds.
    // like, when there's an evil client that notifies the listener every 100 ms,
    // we still wait for N ms after the notifications are over
    const onReceive = async () => {
      log.info('Received schema change notification. Rebuilding it')
      let newSchema
      try {
        newSchema = await buildSchema(models)
      } catch (ex) {
        log.error('Error while reloading config')
        log.error(ex)
        log.error('Will continue using the old config')
      }

      if (newSchema) {
        try {
          await disconnectDataSources(dataSources) // disconnect existing ones first
        } catch (ex) {
          log.error('Error while disconnecting previous data sources')
          log.error(ex)
          log.error('Will continue connecting to new ones')
        }

        try {
          await connectDataSources(newSchema.dataSources)
          schema = newSchema.schema
          dataSources = newSchema.dataSources
        } catch (ex) {
          log.error('Error while connecting to new data sources')
          log.error(ex)
          log.error('Will use the old schema and the data sources')
          try {
            await connectDataSources(dataSources)
          } catch (ex) {
            log.error('Error while connecting to previous data sources')
            log.error(ex)
          }
        }
      }
    }
    const debouncedOnReceive = _.debounce(onReceive, 500)
    schemaListener.start(debouncedOnReceive)
  }

  // Wrap the Express server
  const server = http.createServer(app)

  const stopHandler = async () => {
    try {
      log.info('SIGTERM received. Closing connections, stopping server')
      await models.sequelize.close()
      if (schemaListener) await schemaListener.stop()
      await disconnectDataSources(dataSources)
      await server.close()
      log.info('Shutting down')
    } catch (ex) {
      log.error('Error during graceful shutdown')
      log.error(ex)
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGTERM', stopHandler)
  process.on('SIGABRT', stopHandler)
  process.on('SIGQUIT', stopHandler)
  process.on('SIGINT', stopHandler)

  return server
}

async function buildSchema (models) {
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

  const dataSources = await models.DataSource.findAll()
  let dataSourcesJson = dataSources.map((dataSource) => {
    return dataSource.toJSON()
  })

  const resolvers = await models.Resolver.findAll({
    include: [models.DataSource]
  })
  let resolversJson = resolvers.map((resolver) => {
    return resolver.toJSON()
  })

  if (_.isEmpty(graphQLSchemaString) || _.isEmpty(dataSourcesJson) || _.isEmpty(resolversJson)) {
    log.warn('At least one of schema, dataSources or resolvers is missing. Using noop defaults')
    // according to http://facebook.github.io/graphql/June2018/#sec-Root-Operation-Types,
    // a schema has to have 'query' field defined and it must be of object type!
    // let's add 'mutation' and 'subscription' as well, as they're generated by default using resolverMapper
    // and, an object must have a field: http://facebook.github.io/graphql/June2018/#sec-Objects
    graphQLSchemaString = `
      schema {
        query: Query
        mutation: Mutation
        subscription: Subscription
      }
      type Query {
        _: Boolean
      }
      type Mutation {
        _: Boolean
      }
      type Subscription {
        _: Boolean
      }
    `

    dataSourcesJson = {}
    resolversJson = {}
  }

  try {
    return schemaParser(graphQLSchemaString, dataSourcesJson, resolversJson)
  } catch (error) {
    log.error('Error while building schema.')
    log.error(error)
    throw (error)
  }
}

async function connectDataSources (dataSources) {
  log.info('Connecting data sources')
  for (let key of Object.keys(dataSources)) {
    const dataSource = dataSources[key]
    try {
      await dataSource.connect()
    } catch (error) {
      log.error(`Error while connecting datasource with key ${key}`)
      log.error(error)
      throw (error)
    }
  }
}

async function disconnectDataSources (dataSources) {
  log.info('Disconnecting data sources')
  for (let key of Object.keys(dataSources)) {
    const dataSource = dataSources[key]
    try {
      await dataSource.disconnect()
    } catch (error) {
      log.error(`Error while disconnecting datasource with key ${key}`)
      log.error(error)
      // swallow
    }
  }
}
