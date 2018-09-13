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
const { Core } = require('@aerogear/data-sync-gql-core')
const schemaListenerCreator = require('./lib/schemaListeners/schemaListenerCreator')
const { makeExecutableSchema } = require('graphql-tools')

class DataSyncServer {
  constructor (config, pubsub) {
    this.config = config
    this.pubsub = pubsub

    this.schema = null
    this.dataSources = null
  }

  async initializeCore (config) {
    this.core = new Core(config.postgresConfig, makeExecutableSchema)
    this.models = await this.core.getModels()
    this.models.sync({ logging: false })
  }

  async initialize () {
    await this.initializeCore(this.config)
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

    // generate the GraphQL Schema
    const { schema, dataSources } = await this.core.buildSchema('default', this.pubsub, this.serverConfig.schemaDirectives)
    this.schema = schema
    this.dataSources = dataSources

    await this.core.connectActiveDataSources(this.dataSources)

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
    this.apolloServer = newApolloServer(this.app, this.schema, this.server, this.serverConfig.tracing, this.serverConfig.playgroundConfig, this.serverConfig.graphQLConfig.graphqlEndpoint, this.serverConfig.securityService, this.serverConfig.serverSecurity)
    this.server.on('request', this.app)
  }

  async cleanup () {
    await this.models.sequelize.close()
    if (this.schemaListener) await this.schemaListener.stop()
    if (this.dataSources) await this.core.disconnectActiveDataSources(this.dataSources)
    if (this.server) await this.server.close()
  }

  async onSchemaChangedNotification () {
    log.info('Received schema change notification. Rebuilding it')
    let newSchema
    try {
      newSchema = await this.core.buildSchema('default', this.pubsub, this.serverConfig.schemaDirectives)
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
      this.newServer()

      try {
        await this.core.disconnectActiveDataSources(this.dataSources) // disconnect existing ones first
      } catch (ex) {
        log.error('Error while disconnecting previous data sources')
        log.error(ex)
        log.error('Will continue connecting to new ones')
      }

      try {
        await this.core.connectActiveDataSources(newSchema.dataSources)
        this.dataSources = newSchema.dataSources
      } catch (ex) {
        log.error('Error while connecting to new data sources')
        log.error(ex)
        log.error('Will use the old schema and the data sources')
        try {
          await this.core.connectActiveDataSources(this.dataSources)
        } catch (ex) {
          log.error('Error while connecting to previous data sources')
          log.error(ex)
        }
      }
    }
  }
}

module.exports = DataSyncServer
