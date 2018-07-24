const notifiers = require('./notifiers')

module.exports = function NewPubSub (pubsubConfig) {
  const PubSubClass = notifiers[pubsubConfig.type]

  if (!PubSubClass) {
    throw new Error(`Unhandled pubsub type: ${pubsubConfig.type}`)
  }

  if (typeof PubSubClass !== 'function') {
    throw new Error(`PubSub implementation for ${pubsubConfig.type} is missing a constructor`)
  }

  const pubsub = new PubSubClass(pubsubConfig.config)

  if (!pubsub.publish && typeof pubsub.publish !== 'function') {
    throw new Error(`Pubsub implementation for ${pubsubConfig.type} is missing "publish" function`)
  }

  if (!pubsub.getAsyncIterator && typeof pubsub.getAsyncIterator !== 'function') {
    throw new Error(`Pubsub implementation for ${pubsubConfig.type} is missing "getAsyncIterator" function`)
  }

  return pubsub
}
