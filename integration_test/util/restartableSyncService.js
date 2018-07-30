const DataSyncService = require('../../index')
const stoppable = require('stoppable')

class RestartableSyncService extends DataSyncService {
  async start () {
    this.app.server = stoppable(this.app.server, 0)
    await this.app.server.listen(this.port)
    this.log.info(`Server is now running on http://localhost:${this.port}`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  async restart () {
    this.log.info('restarting server')
    await this.app.cleanup()
    this.app.server.stop()
    await this.initialize()
    await this.start()
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

module.exports = RestartableSyncService
