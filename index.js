const config = require('./server/config')

let {postgresConfig} = config
let {port} = config.server

const models = require('./sequelize/models/index')(postgresConfig)
models.sequelize.sync().then(async () => {
  const server = await require('./server/server')(config, models)
  await server.listen(port)
  console.log(`Server is now running on http://localhost:${port}`)
})
