const http = require('http')
const _ = require('lodash')

// server
const newExpressApp = require('./expressApp')
const newApolloServer = require('./apolloServer')
const SecurityService = require('./security/SecurityService')

// middlewares
const { log } = require('./lib/util/logger')
const expressPino = require('express-pino-logger')({ logger: log })
const { getMetrics, responseLoggingMetric } = require('./metrics')

if (process.env.LOG_LEVEL) {
  expressPino.logger.level = process.env.LOG_LEVEL
} else {
  expressPino.logger.level = 'debug'
}

// schema
const { buildSchema, buildDataSources } = require('./buildSchema')
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

    let securityService
    let schemaDirectives

    if (securityServiceConfig.type && securityServiceConfig.config) {
      securityService = new SecurityService(securityServiceConfig)
      schemaDirectives = securityService.getSchemaDirectives()
    }

    const serverConfig = {
      expressAppOptions: {
        keycloakConfig: keycloakConfig,
        graphqlEndpoint: graphQLConfig.graphqlEndpoint,
        models: this.models
      },
      expressAppMiddlewares: {
        metrics: getMetrics,
        responseLoggingMetric,
        logging: expressPino
      },
      serverSecurity: serverSecurity,
      securityService: securityService,
      schemaDirectives: schemaDirectives,
      graphQLConfig: graphQLConfig,
      playgroundConfig: playgroundConfig,
      schemaListenerConfig: schemaListenerConfig
    }

    this.serverConfig = serverConfig

    this.dataSources = await buildDataSources(this.models)
    await this.connectDataSources(this.dataSources)

    // generate the GraphQL Schema
    this.schema = await buildSchema(this.models, this.pubsub, this.dataSources, this.serverConfig.schemaDirectives)

    this.newServer()

    function startListening (port) {
      var server = this
      return new Promise((resolve) => {
        server.listen(port, resolve)
      })
    }

    this.server.startListening = startListening.bind(this.server)

    // Initialize the schema listener for hot reload
    this.schemaListener = schemaListenerCreator(this.serverConfig.schemaListenerConfig)
    this.debouncedOnSchemaRebuild = _.debounce(this.onSchemaChangedNotification, 500).bind(this)
    this.schemaListener.start(this.debouncedOnSchemaRebuild)
  }

  /**
   * Starts or restarts express app and Apollo server
   */
  newServer () {
    // Initialize an express app, apply the apollo middleware, and mount the app to the http server
    this.app = newExpressApp(this.serverConfig.expressAppOptions, this.serverConfig.expressAppMiddlewares, this.serverConfig.securityService)
    this.apolloServer = newApolloServer(this.app, this.schema, this.server, this.serverConfig.graphQLConfig.tracing, this.serverConfig.playgroundConfig, this.serverConfig.graphQLConfig.graphqlEndpoint, this.serverConfig.securityService, this.serverConfig.serverSecurity)
    this.server.on('request', this.app)
  }

  async cleanup () {
    await this.models.sequelize.close()
    if (this.schemaListener) await this.schemaListener.stop()
    if (this.dataSources) await this.disconnectDataSources(this.dataSources)
    if (this.server) await this.server.close()
  }

  async onSchemaChangedNotification () {
    log.info('Received schema change notification. Rebuilding it')
    let newDataSources
    let newSchema

    try {
      newDataSources = await buildDataSources(this.models)
      await this.connectDataSources(newDataSources)
    } catch (ex) {
      log.error('Error while connecting to new data sources')
      log.error(ex)
      log.error('Will use the old schema and the data sources')
      return
    }

    try {
      newSchema = await buildSchema(this.models, this.pubsub, newDataSources, this.serverConfig.schemaDirectives)
    } catch (ex) {
      log.error('Error while reloading config')
      log.error(ex)
      log.error('Will continue using the old config')
      return
    }

    if (newSchema && newDataSources) {
      // first do some cleaning up
      this.apolloServer.subscriptionServer.close()
      this.server.removeListener('request', this.app)

      try {
        await this.disconnectDataSources(this.dataSources) // disconnect existing ones first
      } catch (ex) {
        log.error('Error while disconnecting previous data sources')
        log.error(ex)
        log.error('Will continue connecting to new ones')
      }

      // reinitialize the server objects
      this.dataSources = newDataSources
      this.schema = newSchema
      this.newServer()
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
