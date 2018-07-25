const { log } = require('../../util/logger')
const { PostgresPubSub } = require('graphql-postgres-subscriptions')

function NewPostgresPubSub (config) {
  const client = new PostgresPubSub(config)

  this.publish = function publish ({ topic, compiledPayload }, context) {
    let payload = compiledPayload(context)
    log.info('publishing to topic', { topic, payload })
    client.publish(topic, payload)
  }

  this.getAsyncIterator = function getAsyncIterator (topic) {
    return client.asyncIterator(topic)
  }
}

module.exports = NewPostgresPubSub
