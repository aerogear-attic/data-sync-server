const _ = require('lodash')
const {Client} = require('pg')

module.exports = function (dataSources, connect = true) {
  let dataSourceClients = {}
  let dataSourceTypes = {}
  // connect to any datasources with persistent connections
  _.forEach(dataSources, (value, key) => {
    let isHandled = false
    if (value.type === 'postgres') {
      dataSourceClients[key] = new Client(value.config)
      if (connect) {
        dataSourceClients[key].connect()
      }
      isHandled = true
    }

    if (isHandled) {
      dataSourceTypes[key] = value.type
    } else {
      throw new Error('Unhandled data source type: ' + value.type)
    }
  })

  return {
    dataSourceTypes,
    // didn't want to set 'type' property on pg.Client object
    dataSourceClients
  }
}
