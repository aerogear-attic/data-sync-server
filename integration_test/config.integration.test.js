const {test} = require('ava')
const PGPubsub = require('pg-pubsub')
const {createApolloFetch} = require('apollo-fetch')

const config = require('../server/config')
const {postgresConfig} = config
const models = require('../sequelize/models/index')(postgresConfig)

const fetch = createApolloFetch({
  uri: 'http://localhost:8000/graphql'
})

const sequelize = models.sequelize
// see http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html
const qi = sequelize.queryInterface

let pubsubInstance

// delete the all the config 1-time before starting the tests
// also trigger a hot reload with that
test.before(async t => {
  await qi.bulkDelete('DataSources')
  await qi.bulkDelete('GraphQLSchemas')
  await qi.bulkDelete('Resolvers')

  pubsubInstance = new PGPubsub({
    user: postgresConfig.username,
    host: postgresConfig.host,
    database: postgresConfig.database,
    password: postgresConfig.password,
    port: postgresConfig.port
  })

  await pubsubInstance.publish('aerogear-data-sync-config', {})
  // sleep 1000 ms so that sync server can pick up the changes
  await new Promise(resolve => setTimeout(resolve, 1000))
})

test.serial('should run with empty schema when no config provided', async t => {
  // empty schema has a Query defined with name '_'

  const res = await fetch({
    query: '{ _ }'
  })

  t.falsy(res.errors)
})

test.serial('should pick up schema changes', async t => {
  let res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.truthy(res.errors)

  await feedConfig('simple.inmem.valid.notes')

  res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {listNotes: []}) // no data since no mutation is executed
})

async function feedConfig (configFile) {
  const config = require(`./config/${configFile}`)
  if (!config.description) {
    throw new Error(`Please define the description in file ./config/${configFile}`)
  }
  await config.up(qi, sequelize)

  await pubsubInstance.publish('aerogear-data-sync-config', {})
  // sleep 1000 ms so that sync server can pick up the changes
  await new Promise(resolve => setTimeout(resolve, 1000))
}
