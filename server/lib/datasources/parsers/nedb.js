const Datastore = require('nedb')

const type = 'InMemory'

function NEDBDatasource (config = {}) {
  let client
  this.type = type

  this.connect = async () => {
    if (!client) {
      client = new Datastore(config.options)
    }
  }

  this.disconnect = async () => {
    client = undefined
  }

  this.getClient = () => {
    if (!client) {
      throw new Error('Data source is disconnected! Reconnect first')
    }
    return client
  }
}

module.exports = NEDBDatasource
