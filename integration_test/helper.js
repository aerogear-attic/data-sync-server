const PGPubsub = require('pg-pubsub')
const pg = require('pg')
const RestartableSyncService = require('./util/restartableSyncService')
const TestApolloClient = require('./util/testApolloClient')

let config = require('../server/config')
let { postgresConfig } = config

function Helper () {
  this.pubsubInstance = new PGPubsub({
    user: postgresConfig.username,
    host: postgresConfig.host,
    database: postgresConfig.database,
    password: postgresConfig.password,
    port: postgresConfig.port
  })

  this.syncService = new RestartableSyncService(config)

  this.models = require('@aerogear/data-sync-gql-core').models(postgresConfig)
  this.sequelize = this.models.sequelize

  // see http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html
  this.qi = this.sequelize.queryInterface

  this.initialize = async () => {
    this.resetApolloClient()
    await this.syncService.initialize()
    await this.syncService.start()
  }

  this.resetApolloClient = (headers) => {
    this.apolloClient = new TestApolloClient('localhost:8000', headers)
  }

  this.deleteConfig = async () => {
    await this.qi.bulkDelete('DataSources')
    await this.qi.bulkDelete('GraphQLSchemas')
    await this.qi.bulkDelete('Subscriptions')
    await this.qi.bulkDelete('Resolvers')
  }

  this.feedConfig = async (configFile) => {
    const config = require(`./config/${configFile}`)
    if (!config.description) {
      throw new Error(`Please define the description in file ./config/${configFile}`)
    }
    await config.up(this.qi, this.sequelize)
  }

  this.triggerReload = async () => {
    this.pubsubInstance.publish('aerogear-data-sync-config', {})
    // sleep 1000 ms so that sync server can pick up the changes
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  this.listenForPubsubNotification = (topic) => {
    return new Promise((resolve, reject) => {
      this.pubsubInstance.addChannel(topic)
      this.pubsubInstance.on(topic, resolve)
      setTimeout(reject.bind(null, new Error(`Timed out while listening for pubsub message on topic ${topic}`)), 3000)
    })
  }

  this.cleanMemeolistDatabase = async (t) => {
    t.log('Going to prepare memeolist database for the integration tests')

    const { Client } = pg

    const memeoListDbHost = process.env.MEMEOLIST_DB_HOST || '127.0.0.1'
    const memeoListDbPort = process.env.MEMEOLIST_DB_PORT || '15432'

    const client = new Client({
      user: 'postgresql',
      password: 'postgres',
      database: 'memeolist_db',
      host: memeoListDbHost,
      port: memeoListDbPort
    })

    try {
      await client.connect()
      await client.query('SELECT 1')
    } catch (err) {
      t.log('Unable to connect memeolist database for preparing it for the integration tests')
      throw err
    }

    try {
      // language=SQL
      await client.query(`
        DROP TABLE IF EXISTS "Meme";
        DROP TABLE IF EXISTS "Profile";

        CREATE TABLE "Profile" (
          "id"          SERIAL PRIMARY KEY     NOT NULL,
          "email"       CHARACTER VARYING(500) NOT NULL,
          "displayName" CHARACTER VARYING(500) NOT NULL,
          "biography"   CHARACTER VARYING(500) NOT NULL,
          "avatarUrl"   CHARACTER VARYING(500) NOT NULL
        );

        CREATE TABLE "Meme" (
          "id"       SERIAL PRIMARY KEY                NOT NULL,
          "photoUrl" CHARACTER VARYING(500)            NOT NULL,
          "ownerId"  INTEGER
        );
      `)
    } catch (err) {
      t.log('Error while preparing memeolist database for the integration tests')
      throw err
    }

    await client.end()
  }
}

module.exports = Helper
