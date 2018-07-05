const config = {
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
  },
  schemaListenerConfig: undefined
}

if (process.env.SCHEMA_LISTENER_CONFIG) {
  let schemaListenerConfigStr
  try {
    schemaListenerConfigStr = Buffer.from(process.env.SCHEMA_LISTENER_CONFIG, 'base64').toString()
  } catch (ex) {
    console.error(`Cannot base64 decode SCHEMA_LISTENER_CONFIG environment variable: ${process.env.SCHEMA_LISTENER_CONFIG}`)
    process.exit(1)
  }

  try {
    config.schemaListenerConfig = JSON.parse(schemaListenerConfigStr)
  } catch (ex) {
    console.error(`Base64 decoded SCHEMA_LISTENER_CONFIG environment variable is not valid json: ${schemaListenerConfigStr}`)
    process.exit(1)
  }
} else {
  console.info(`Using default schemaListener since SCHEMA_LISTENER_CONFIG environment variable is not defined`)

  config.schemaListenerConfig = {
    type: 'postgres',
    config: {
      channel: 'aerogear-data-sync-config',
      database: config.postgresConfig.database,
      username: config.postgresConfig.username,
      password: config.postgresConfig.password,
      host: config.postgresConfig.host,
      port: config.postgresConfig.port
    }
  }
}

module.exports = config
