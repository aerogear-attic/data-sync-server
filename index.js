const config = require('./server/config')
const { log } = require('./server/lib/util/logger')
const PubSub = require('./server/lib/pubsubNotifiers/pubsubNotifier')

let { pubsubConfig, postgresConfig } = config
let { port } = config.server

process.on('uncaughtException', err => console.error('uncaught exception:', err))
process.on('unhandledRejection', error => console.error('unhandled rejection:', error))

async function start () {
  const models = require('./sequelize/models/index')(postgresConfig)
  await models.sequelize.sync({ logging: false })
  const pubsub = PubSub(pubsubConfig)

  const server = await require('./server/server')(config, models, pubsub)
  await server.listen(port)
  log.info(`Server is now running on http://localhost:${port}`)
}

start()
