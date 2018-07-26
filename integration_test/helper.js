const PGPubsub = require('pg-pubsub')
const {createApolloFetch} = require('apollo-fetch')

let config = require('../server/config')
let {postgresConfig} = config
let models = require('../sequelize/models/index')(postgresConfig)

const sequelize = models.sequelize
// see http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html
const qi = sequelize.queryInterface

function Helper () {
  const pubsubInstance = new PGPubsub({
    user: postgresConfig.user,
    host: postgresConfig.host,
    database: postgresConfig.database,
    password: postgresConfig.password,
    port: postgresConfig.port
  })

  this.initialize = async () => {
    this.fetch = createApolloFetch({
      uri: 'http://localhost:8000/graphql'
    })
  }

  this.deleteConfig = async () => {
    await qi.bulkDelete('DataSources')
    await qi.bulkDelete('GraphQLSchemas')
    await qi.bulkDelete('Resolvers')
  }

  this.feedConfig = async (configFile) => {
    const config = require(`./config/${configFile}`)
    if (!config.description) {
      throw new Error(`Please define the description in file ./config/${configFile}`)
    }
    await config.up(qi, sequelize)
  }

  this.triggerReload = async () => {
    await pubsubInstance.publish('aerogear-data-sync-config', {})
    // sleep 1000 ms so that sync server can pick up the changes
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

module.exports = Helper
