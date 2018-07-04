// resolvers we can build
module.exports = {
  // Matches the DataSource type ENUM in the models/dataSource.js
  InMemory: require('./nedb'),
  Postgres: require('./postgres')
}
