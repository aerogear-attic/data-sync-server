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
  }

  async initialize () {
    let { pubsubConfig } = this.config
    this.pubsub = PubSub(pubsubConfig)

    this.app = new DataSyncServer(this.config, this.pubsub)
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
