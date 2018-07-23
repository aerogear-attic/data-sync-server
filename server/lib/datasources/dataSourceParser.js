const {forEach} = require('lodash')

// data sources we can parse
const parsers = require('./parsers')

module.exports = function (dataSourceDefs, connect = true) {
  let dataSources = {}
  // only create the data sources. will connect later
  forEach(dataSourceDefs, (dataSourceDef) => {
    let Parser = parsers[dataSourceDef.type]
    const dataSourceName = dataSourceDef.name

    if (!Parser) {
      throw new Error(`Unhandled data source type: ${dataSourceDef.type}`)
    }

    if (typeof Parser !== 'function') {
      throw new Error(`Data source parser for ${dataSourceDef.type} is missing a constructor`)
    }

    const dataSourceObj = new Parser(dataSourceDef.config)

    if (!dataSourceObj.connect && typeof dataSourceObj.connect !== 'function') {
      throw new Error(`Data source for ${dataSourceDef.type} is missing "connect" function`)
    }

    if (!dataSourceObj.disconnect && typeof dataSourceObj.disconnect !== 'function') {
      throw new Error(`Data source for ${dataSourceDef.type} is missing "disconnect" function`)
    }

    if (!dataSourceObj.getClient && typeof dataSourceObj.getClient !== 'function') {
      throw new Error(`Data source for ${dataSourceDef.type} is missing "getClient" function`)
    }

    dataSources[dataSourceName] = dataSourceObj
  })

  return dataSources
}
