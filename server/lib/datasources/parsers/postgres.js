const {Pool} = require('pg')
const {log} = require('../../util/logger')

const type = 'Postgres'

function PostgresDataSource (config = {}) {
  // Node Postgres lib recommends using `Pool`s instead of clients
  // to handle auto reconnect, even though the program needs only 1 client
  let pool

  this.type = type

  this.connect = async () => {
    // in case of a schema/resolver building error, we will reconnect the existing data sources
    // thus, check if the data source is already connected first
    if (!pool) {
      pool = new Pool(config.options)

      pool.on('error', err => {
        log.warn('Postgres connection error. Will try to reconnect with the next request')
        log.warn('Error: ' + err.message)
      })
    }
  }

  this.disconnect = async () => {
    await pool.end()
    pool = undefined
  }

  this.getClient = () => {
    if (!pool) {
      throw new Error('Data source is disconnected! Reconnect first')
    }
    return pool
  }
}

module.exports = PostgresDataSource
