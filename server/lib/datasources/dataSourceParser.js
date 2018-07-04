const { forEach } = require('lodash')

// data sources we can parse
const parsers = require('./parsers')

module.exports = function (dataSourceDefs, connect = true) {
  let dataSources = {}
  // connect to any datasources with persistent connections
  forEach(dataSourceDefs, (dataSource, dataSourceName) => {
    let parser = parsers[dataSource.type]

    if (parser) {
      if (parser.createDataSource && typeof parser.createDataSource === 'function') {
        dataSources[dataSourceName] = parser.createDataSource(dataSource.config, connect)
      } else {
        throw new Error(`Parser ${dataSource.type} missing create function`)
      }
    } else {
      throw new Error(`Unhandled data source type: ${dataSource.type}`)
    }
  })

  return dataSources
}
