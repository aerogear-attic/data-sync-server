const PGPubsub = require('pg-pubsub')

function PostgresListener (config) {
  let pubsubInstance

  pubsubInstance = new PGPubsub({
    user: config.username,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port
  })

  this.start = function (onReceive) {
    pubsubInstance.addChannel(config.channel, async function () {
      console.log('Received notification from listened Postgres channel')
      onReceive()
    })
  }

  this.stop = function () {
    pubsubInstance.close()
  }

  return this
}

module.exports = PostgresListener
