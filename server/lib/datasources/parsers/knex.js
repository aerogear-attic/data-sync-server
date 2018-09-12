const knex = require('knex')
const { log } = require('../../util/logger')

const type = 'Postgres'

function KnexDataSource (config = {}) {
  let db

  this.type = type

  this.connect = async () => {
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
