const config = require('./server/config')
const DataSyncService = require('./DataSyncService')
const { log } = require('./server/lib/util/logger')

process.on('uncaughtException', log.error.bind(log))
process.on('unhandledRejection', log.error.bind(log))

async function start () {
  const syncService = new DataSyncService(config)
  const stopSignals = ['SIGTERM', 'SIGABRT', 'SIGQUIT', 'SIGINT']

  stopSignals.forEach(signal => {
    process.on(signal, syncService.gracefulShutdown.bind(syncService, signal))
  })

  await syncService.initialize()
  await syncService.start()
}

start()
