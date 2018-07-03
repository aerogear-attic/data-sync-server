const { Client } = require('pg')

const type = 'postgres'

function CreatePostgresDataSource (config = {}, connect = true) {
  let client = new Client(config)
  if (connect) {
    client.connect()
  }
  return { client, type }
}

module.exports = {
  createDataSource: CreatePostgresDataSource
}
