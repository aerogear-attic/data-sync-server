const {Client} = require('pg')

const type = 'Postgres'

function PostgresDataSource (config = {}) {
  this.client = new Client(config.options)
  this.type = type
  this.connect = async () => {
    await this.client.connect()
  }
  this.disconnect = async () => {
    await this.client.end()
  }
}

module.exports = PostgresDataSource
