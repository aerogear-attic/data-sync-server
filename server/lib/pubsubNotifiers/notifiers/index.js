
// pub sub implementations for subscriptions
module.exports = {
  InMemory: require('./inMemory'), // Not for prod, should only be used for testing
  Postgres: require('./postgres')
}
