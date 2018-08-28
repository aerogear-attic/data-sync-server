const DataSyncServer = require('./server/server')
const { log } = require('./server/lib/util/logger')
const PubSub = require('./server/lib/pubsubNotifiers/pubsubNotifier')

class DataSyncService {
  constructor (config) {
    this.config = config
    this.port = this.config.server.port
    this.log = log

    this.app = null
    this.pubsub = null
    this.models = null
  }

  async initialize () {
    let { pubsubConfig, postgresConfig } = this.config
    this.pubsub = PubSub(pubsubConfig)

    this.models = require('./sequelize/models/index')(postgresConfig)
    await this.models.sequelize.sync({ logging: false })

    this.app = new DataSyncServer(this.config, this.models, this.pubsub)
    await this.app.initialize()
  }

  async start () {
    await this.app.server.startListening(this.port)
    this.log.info(`Server is now running on http://localhost:${this.port}`)
  }

  async gracefulShutdown (signal) {
    try {
      this.log.info(`${signal} received. Closing connections, stopping server`)
      await this.app.cleanup
      this.log.info('Shutting down')
    } catch (ex) {
      this.log.error('Error during graceful shutdown')
      this.log.error(ex)
    } finally {
      process.exit(0)
    }
  }
}

module.exports = DataSyncService
