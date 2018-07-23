const PubSub = require('graphql-subscriptions').PubSub

module.exports = (config) => {
  return {
    type: 'InMemory',
    client: new PubSub()
  }
}
