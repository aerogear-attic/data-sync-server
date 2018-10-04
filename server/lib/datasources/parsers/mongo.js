const { log } = require('../../util/logger')
const MongoClient = require('mongodb').MongoClient

const type = 'Mongo'

function MongoSource (config = {}) {
  let db
  let client

  this.type = type

  this.connect = async () => {
    const options = config.options
    if (!db) {
      log.debug('Connecting to mongo', options)
      // Use connect method to connect to the Server
      client = await MongoClient.connect(options.url)
      db = client.db(options.database)
    }
  }

  this.disconnect = async () => {
    await client.close()
    db = undefined
  }

  this.getClient = () => {
    if (!db) {
      throw new Error('Data source is disconnected! Reconnect first')
    }
    return db
  }
}

module.exports = MongoSource
