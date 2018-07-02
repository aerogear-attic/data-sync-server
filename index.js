const config = require('./server/config')

let { graphQLConfig, graphiqlConfig, postgresConfig } = config
let { port } = config.server

const models = require('./models/index')(postgresConfig)
models.sequelize.sync().then(async () => {
  const server = await require('./server/server')({ graphQLConfig, graphiqlConfig }, models)
  await server.listen(port)
  console.log(`Server is now running on http://localhost:${port}`)
})
