const { Client } = require('pg')

const type = 'Postgres'

function CreatePostgresDataSource (config = {}, connect = true) {
  let client = new Client(config.options)
  if (connect) {
    client.connect()
  }
  return { client, type }
}

module.exports = {
  createDataSource: CreatePostgresDataSource
}
