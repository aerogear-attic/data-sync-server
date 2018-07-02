const _ = require('lodash')
const {Client} = require('pg')

module.exports = function (dataSources) {
  let dataSourceClients = {}
  let dataSourceTypes = {}
  // connect to any datasources with persistent connections
  _.forEach(dataSources, (value, key) => {
    if (value.type === 'postgres') {
      dataSourceClients[key] = new Client(value.config)
      dataSourceClients[key].connect()
    }

    dataSourceTypes[key] = value.type
  })

  return {
    dataSourceTypes,
    // didn't want to set 'type' property on pg.Client object
    dataSourceClients
  }
}
