const PGPubsub = require('pg-pubsub')

module.exports = function (config, onReceive) {
  const pubsubInstance = new PGPubsub({
    user: config.username,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port
  })

  pubsubInstance.addChannel(config.channel, async function () {
    console.log('Received notification from listened Postgres channel')
    onReceive()
  })
}
