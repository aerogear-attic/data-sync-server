const knex = require('knex')
const { log } = require('../../util/logger')

const type = 'Postgres'

function KnexDataSource (config = {}) {
  // Node Postgres lib recommends using `Pool`s instead of clients
  // to handle auto reconnect, even though the program needs only 1 client
  let db

  this.type = type

  this.connect = async () => {
    // in case of a schema/resolver building error, we will reconnect the existing data sources
    // thus, check if the data source is already connected first
    if (!db) {
      db = knex({
        client: 'pg',
        connection: config.options,
        log: {
          warn: log.warn.bind(log),
          error: log.error.bind(log),
          deprecate: log.warn.bind(log),
          debug: log.debug.bind(log)
        }
      })
    }
  }

  this.disconnect = async () => {
    await db.destroy()
    db = undefined
  }

  this.getClient = () => {
    if (!db) {
      throw new Error('Data source is disconnected! Reconnect first')
    }
    return db
  }
}

module.exports = KnexDataSource
