const Datastore = require('nedb')

const type = 'InMemory'

function createNEDBDatasource (config = {}, connect = true) {
  return { client: new Datastore(config.options), type }
}

module.exports = {
  createDataSource: createNEDBDatasource
}
