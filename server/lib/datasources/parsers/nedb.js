const Datastore = require('nedb')

const type = 'nedb'

function createNEDBDatasource (config = {}, connect = true) {
  return { client: new Datastore(), type }
}

module.exports = {
  createDataSource: createNEDBDatasource
}
