const _ = require('lodash')
const { Client } = require('pg')

module.exports = function (dataSourceDefs, connect = true) {
  let dataSources = {}
  // connect to any datasources with persistent connections
  _.forEach(dataSourceDefs, (dataSource, dataSourceName) => {
    let isHandled = false

    if (dataSource.type === 'postgres') {
      dataSources[dataSourceName] = createPostgresDataSource(dataSource.config, connect)
      isHandled = true
    }

    if (!isHandled) {
      throw new Error('Unhandled data source type: ' + dataSource.type)
    }
  })

  return dataSources
}

function createPostgresDataSource (config, connect = true) {
  let client = new Client(config)
  if (connect) {
    client.connect()
  }
  return { client, type: 'postgres' }
}
