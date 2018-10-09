const fs = require('fs')
const { hostname } = require('os')

const { log } = require('../lib/util/logger')

require('dotenv').config()

let playgroundQueryFileContent = ''
let playgroundVariableFileContent = ''

if (process.env.PLAYGROUND_QUERY_FILE) {
  try {
    playgroundQueryFileContent = fs.readFileSync(process.env.PLAYGROUND_QUERY_FILE, 'utf-8')
  } catch (ex) {
    log.error(`Unable to read PLAYGROUND_QUERY_FILE ${process.env.PLAYGROUND_QUERY_FILE} . Skipping it.`)
    log.error(ex)
  }
}

if (process.env.PLAYGROUND_VARIABLES_FILE) {
  try {
    playgroundVariableFileContent = fs.readFileSync(process.env.PLAYGROUND_VARIABLES_FILE, 'utf-8')
    playgroundVariableFileContent = JSON.parse(playgroundVariableFileContent)
  } catch (ex) {
    log.error(`Unable to read PLAYGROUND_VARIABLES_FILE ${process.env.PLAYGROUND_VARIABLES_FILE} . Skipping it.`)
    log.error(ex)
  }
}

const graphqlEndpoint = '/graphql'
const port = process.env.HTTP_PORT || '8000'

const config = {
  server: {
    port
  },
  graphQLConfig: {
    graphqlEndpoint,
    tracing: true
  },
  playgroundConfig: {
    endpoint: graphqlEndpoint, // if you want GraphiQL enabled
    query: playgroundQueryFileContent,
    variables: playgroundVariableFileContent,
    subscriptionEndpoint: process.env.PLAYGROUND_SUBS_ENDPOINT || `ws://${hostname()}:${port}/subscriptions`
  },
  postgresConfig: {
    database: process.env.POSTGRES_DATABASE || 'aerogear_data_sync_db',
    username: process.env.POSTGRES_USERNAME || 'postgresql',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    options: {
      host: process.env.POSTGRES_HOST || '127.0.0.1',
      port: process.env.POSTGRES_PORT || '5432',
      dialect: 'postgres',
      operatorsAliases: false,
      logging: false
    }
  },
  pubsubConfig: {},
  securityServiceConfig: {
    type: null, // e.g. type 'keycloak' or 'passport'
    config: null // implementation specific config
  },
  schemaListenerConfig: undefined,
  serverSecurity: {
    queryDepthLimit: process.env.QUERY_DEPTH_LIMIT || 20,
    complexityLimit: process.env.COMPLEXITY_LIMIT || 10000
  }
}

if (process.env.SCHEMA_LISTENER_CONFIG) {
  let schemaListenerConfigStr
  try {
    schemaListenerConfigStr = Buffer.from(process.env.SCHEMA_LISTENER_CONFIG, 'base64').toString()
  } catch (ex) {
    log.error(`Cannot base64 decode SCHEMA_LISTENER_CONFIG environment variable: ${process.env.SCHEMA_LISTENER_CONFIG}`)
    process.exit(1)
  }

  try {
    config.schemaListenerConfig = JSON.parse(schemaListenerConfigStr)
  } catch (ex) {
    log.error(`Base64 decoded SCHEMA_LISTENER_CONFIG environment variable is not valid json: ${schemaListenerConfigStr}`)
    process.exit(1)
  }
} else {
  log.info(`Using default schemaListener since SCHEMA_LISTENER_CONFIG environment variable is not defined`)

  config.pubsubConfig = {
    type: 'Postgres',
    config: {
      database: config.postgresConfig.database,
      user: config.postgresConfig.username,
      password: config.postgresConfig.password,
      host: config.postgresConfig.options.host,
      port: config.postgresConfig.options.port
    }
  }

  config.schemaListenerConfig = {
    type: 'postgres',
    config: {
      channel: 'aerogear-data-sync-config',
      database: config.postgresConfig.database,
      username: config.postgresConfig.username,
      password: config.postgresConfig.password,
      host: config.postgresConfig.options.host,
      port: config.postgresConfig.options.port
    }
  }
}

if (process.env.KEYCLOAK_CONFIG_FILE) {
  try {
    const keycloakConfig = fs.readFileSync(process.env.KEYCLOAK_CONFIG_FILE, 'utf-8')

    config.securityServiceConfig.type = 'keycloak'
    config.securityServiceConfig.config = JSON.parse(keycloakConfig)
  } catch (ex) {
    log.error(`Unable to read keycloakConfig in ${process.env.KEYCLOAK_CONFIG_FILE} . Skipping it.`)
    log.error(ex)
  }
}

module.exports = config
