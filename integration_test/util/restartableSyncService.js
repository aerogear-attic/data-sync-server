const DataSyncService = require('../../index')
const stoppable = require('stoppable')

class RestartableSyncService extends DataSyncService {
  constructor (config) {
    super(config)
  }

  async start () {
    this.app.server = stoppable(this.app.server)
    await this.app.server.startListening(this.port)
    this.log.info(`Server is now running on http://localhost:${this.port}`)
  }

  async restart () {
    this.log.info('restarting server')
    await this.app.cleanup()
    this.app.server.stop()
    await this.start()
  }
}

module.exports = RestartableSyncService