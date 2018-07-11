const config = require('./server/config')
const { log } = require('./server/lib/util/logger')

let { postgresConfig } = config
let { port } = config.server

async function start () {
  const models = require('./sequelize/models/index')(postgresConfig)
  await models.sequelize.sync({ logging: false })

  const server = await require('./server/server')(config, models)
  await server.listen(port)
  log.info(`Server is now running on http://localhost:${port}`)
}

start()
