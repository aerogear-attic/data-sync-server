const config = require('./server/config')

let { graphQLConfig, graphiqlConfig } = config
let { port } = config.server

const server = require('./server/server')({ graphQLConfig, graphiqlConfig })

server.listen(port, () => {
  console.log(`Server is now running on http://localhost:${port}`)
})
