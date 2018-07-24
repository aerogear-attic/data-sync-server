const PubSub = require('graphql-subscriptions').PubSub
const { log } = require('../../util/logger')

function InMemoryPubSub (config) {
  const client = new PubSub()

  this.publish = function publish ({ topic, compiledPayload }, context) {
    let payload = compiledPayload(context)
    // The InMemory pubsub implementation wants an object
    // Whereas the postgres one would expect a string
    try {
      payload = JSON.parse(payload)
      log.info('publishing to topic', { topic, payload })
      client.publish(topic, payload)
    } catch (error) {
      log.error('failed to publish to topic: invalid payload', error, payload)
    }
  }

  this.getAsyncIterator = function getAsyncIterator (topic) {
    return client.asyncIterator(topic)
  }
}

module.exports = InMemoryPubSub
