const config = require('./server/config')
const DataSyncService = require('./DataSyncService')
const { log } = require('./server/lib/util/logger')

async function start () {
  const syncService = new DataSyncService(config)
  await syncService.initialize()
  await syncService.start()

  const stopSignals = ['SIGTERM', 'SIGABRT', 'SIGQUIT', 'SIGINT']

  stopSignals.forEach(signal => {
    process.on(signal, syncService.gracefulShutdown.bind(syncService, signal))
  })

  process.on('uncaughtException', log.error.bind(log))
  process.on('unhandledRejection', log.error.bind(log))
}

start()
