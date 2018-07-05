const PGPubsub = require('pg-pubsub')

module.exports = function (config, callback) {
  const pubsubInstance = new PGPubsub({
    user: config.username,
    host: config.host,
    database: config.database,
    password: config.password,
    port: config.port
  })

  // TODO: use _.throttle/_.bounce here
  pubsubInstance.addChannel(config.channel, async function () {
    console.log('Received Postgres pubsub notification')
    callback()
  })
}
