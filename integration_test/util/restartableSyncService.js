const DataSyncService = require('../../DataSyncService')
const stoppable = require('stoppable')

// There's a bug somewhere in the server initialization/start sequence
// Even though we await service.initialize() some things aren't always ready
// Like underlying pubsub layer etc.
const RESTART_DELAY = 200

class RestartableSyncService extends DataSyncService {
  async start () {
    this.app.server = stoppable(this.app.server, 0)
    await this.app.server.listen(this.port)
    this.log.info(`Server is now running on http://localhost:${this.port}`)
    await new Promise(resolve => setTimeout(resolve, RESTART_DELAY))
  }

  async restart () {
    this.log.info('restarting server')
    await this.app.cleanup()
    this.app.server.stop()
    await this.initialize()
    await this.start()
    await new Promise(resolve => setTimeout(resolve, RESTART_DELAY))
  }
}

module.exports = RestartableSyncService
