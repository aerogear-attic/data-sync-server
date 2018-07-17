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

// also trigger a hot reload with that
test.before(async t => {
  pubsubInstance = new PGPubsub({
    user: postgresConfig.username,
    host: postgresConfig.host,
    database: postgresConfig.database,
    password: postgresConfig.password,
    port: postgresConfig.port
  })

  // delete the all the config 1-time before starting the tests
  await deleteConfig()
  await triggerReload()
})

test.serial('should run with empty schema when no config provided', async t => {
  // empty schema has a Query defined with name '_'

  const res = await fetch({
    query: '{ _ }'
  })

  t.falsy(res.errors)
})

test.serial('should pick up config changes', async t => {
  let res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.truthy(res.errors)

  await feedConfig('simple.inmem.valid.notes')
  await triggerReload()

  res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {listNotes: []}) // no data since no mutation is executed
})

test.serial('should use prev config when there is a problem with the new one', async t => {
  // delete everything and feed a valid config
  await deleteConfig()
  await feedConfig('simple.inmem.valid.notes')
  await triggerReload() // make server pick it up

  // delete everything and feed an invalid config
  await deleteConfig()
  await feedConfig('simple.inmem.invalid.notes.bad.schema.syntax')
  await triggerReload() // make server pick it up. it should still use the old valid config

  const res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {listNotes: []}) // no data since no mutation is executed
})

async function deleteConfig () {
  await qi.bulkDelete('DataSources')
  await qi.bulkDelete('GraphQLSchemas')
  await qi.bulkDelete('Resolvers')
}

async function feedConfig (configFile) {
  const config = require(`./config/${configFile}`)
  if (!config.description) {
    throw new Error(`Please define the description in file ./config/${configFile}`)
  }
  await config.up(qi, sequelize)
}

async function triggerReload () {
  await pubsubInstance.publish('aerogear-data-sync-config', {})
  // sleep 1000 ms so that sync server can pick up the changes
  await new Promise(resolve => setTimeout(resolve, 1000))
}
