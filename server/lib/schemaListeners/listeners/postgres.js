const PGPubsub = require('pg-pubsub')
const { log } = require('../../util/logger')

function PostgresListener (config) {
  let pubsubInstance

  pubsubInstance = new PGPubsub({
    user: config.username,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port
  }, { log: log.info.bind(log) })

  this.start = function (onReceive) {
    pubsubInstance.addChannel(config.channel, async function () {
      log.info('Received notification from listened Postgres channel')
      onReceive()
    })
  }

  this.stop = function () {
    pubsubInstance.close()
  }

  return this
}

module.exports = PostgresListener
