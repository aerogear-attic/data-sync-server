var config = {
  server: {
    port: process.env.HTTP_PORT || '8000'
  },
  graphQLConfig: {
    tracing: true
  },
  graphiqlConfig: {
    endpointURL: '/graphql' // if you want GraphiQL enabled
  },
  postgresConfig: {
    database: process.env.POSTGRES_DATABASE || 'aerogear_data_sync_db',
    username: process.env.POSTGRES_USERNAME || 'postgresql',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: process.env.POSTGRES_PORT || '5432'
  }
}

module.exports = config
