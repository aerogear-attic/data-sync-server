const Datastore = require('nedb')

const type = 'InMemory'

function NEDBDatasource (config = {}) {
  this.client = new Datastore(config.options)
  this.type = type
  this.connect = async () => {
    // noop
  }
  this.disconnect = async () => {
    this.client = undefined
  }
  return this
}

module.exports = NEDBDatasource
