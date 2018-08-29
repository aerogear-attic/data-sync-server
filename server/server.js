const http = require('http')
const _ = require('lodash')

// server
const newExpressApp = require('./expressApp')
const newApolloServer = require('./apolloServer')
const SecurityService = require('./security/SecurityService')

// middlewares
const { log } = require('./lib/util/logger')
const expressPino = require('express-pino-logger')({logger: log})
const {getMetrics, responseLoggingMetric} = require('./metrics')

// schema
const buildSchema = require('./buildSchema')
const schemaListenerCreator = require('./lib/schemaListeners/schemaListenerCreator')

class DataSyncServer {
  constructor (config, models, pubsub) {
    this.config = config
    this.models = models
    this.pubsub = pubsub

    this.schema = null
    this.dataSources = null
  }

  async initialize () {
    this.server = http.createServer()

    // get some options
    const {
      graphQLConfig,
      playgroundConfig,
      schemaListenerConfig,
      keycloakConfig,
      securityServiceConfig,
      serverSecurity
    } = this.config

    if (securityServiceConfig.type && securityServiceConfig.config) {
      this.securityService = new SecurityService(securityServiceConfig)
      this.schemaDirectives = this.securityService.getSchemaDirectives()
    }

    // generate the GraphQL Schema
    const { schema, dataSources } = await buildSchema(this.models, this.pubsub, this.schemaDirectives)
    this.schema = schema
    this.dataSources = dataSources

    await this.connectDataSources(this.dataSources)

    const { tracing } = graphQLConfig

    const graphqlEndpoint = graphQLConfig.graphqlEndpoint

    this.expressAppOptions = {
      keycloakConfig,
      graphqlEndpoint,
      models: this.models
    }

    this.expressAppMiddlewares = {
      metrics: getMetrics,
      responseLoggingMetric,
      logging: expressPino
    }

    this.serverSecurity = serverSecurity

    // Initialize an express app, apply the apollo middleware, and mount the app to the http server
    this.app = newExpressApp(this.expressAppOptions, this.expressAppMiddlewares, this.securityService)
    this.apolloServer = newApolloServer(this.app, this.schema, this.server, tracing, playgroundConfig, graphqlEndpoint, this.securityService, this.serverSecurity)
    this.server.on('request', this.app)

    function startListening (port) {
      var server = this
      return new Promise((resolve) => {
        server.listen(port, resolve)
      })
    }

    this.server.startListening = startListening.bind(this.server)

    // Initialize the schema listener for hot reload
    this.schemaListener = schemaListenerCreator(schemaListenerConfig)
    this.debouncedOnReceive = _.debounce(this.onReceive, 500).bind(this)
    this.schemaListener.start(this.debouncedOnReceive)
  }

  async cleanup () {
    await this.models.sequelize.close()
    if (this.schemaListener) await this.schemaListener.stop()
    if (this.dataSources) await this.disconnectDataSources(this.dataSources)
    if (this.server) await this.server.close()
  }

  async onReceive () {
    log.info('Received schema change notification. Rebuilding it')
    let newSchema
    try {
      newSchema = await buildSchema(this.models, this.pubsub)
    } catch (ex) {
      log.error('Error while reloading config')
      log.error(ex)
      log.error('Will continue using the old config')
    }

    if (newSchema) {
      // first do some cleaning up
      this.apolloServer.subscriptionServer.close()
      this.server.removeListener('request', this.app)
      // reinitialize the server objects
      this.schema = newSchema.schema
      this.app = newExpressApp(this.expressAppOptions, this.expressAppMiddlewares)
      this.apolloServer = newApolloServer(this.app, this.schema, this.server, this.config.graphQLConfig.tracing, this.config.playgroundConfig)
      this.server.on('request', this.app)

      try {
        await this.disconnectDataSources(this.dataSources) // disconnect existing ones first
      } catch (ex) {
        log.error('Error while disconnecting previous data sources')
        log.error(ex)
        log.error('Will continue connecting to new ones')
      }

      try {
        await this.connectDataSources(newSchema.dataSources)
        this.dataSources = newSchema.dataSources
      } catch (ex) {
        log.error('Error while connecting to new data sources')
        log.error(ex)
        log.error('Will use the old schema and the data sources')
        try {
          await this.connectDataSources(this.dataSources)
        } catch (ex) {
          log.error('Error while connecting to previous data sources')
          log.error(ex)
        }
      }
    }
  }

  async connectDataSources (dataSources) {
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

  async disconnectDataSources (dataSources) {
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
}

module.exports = DataSyncServer
