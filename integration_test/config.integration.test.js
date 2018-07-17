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

test.serial('should run with default empty schema when no config provided', async t => {
  // default empty schema has a Query defined with name '_'
  const res = await fetch({
    query: '{ _ }'
  })

  t.falsy(res.errors)
})

test.serial('should run with default empty schema when no provided config has empty schema', async t => {
  await deleteConfig()
  await feedConfig('simple.inmem.valid.empty')
  await triggerReload()

  // default empty schema has a Query defined with name '_'
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

  await deleteConfig()
  await feedConfig('simple.inmem.valid.notes')
  await triggerReload()

  res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {listNotes: []}) // no data since no mutation is executed
})

test.serial('should use prev config when there is a schema syntax problem with the new config', async t => {
  // delete everything and feed a valid config
  await deleteConfig()
  await feedConfig('simple.inmem.valid.notes')
  await triggerReload() // make server pick it up

  // delete everything and feed an invalid config
  await deleteConfig()
  await feedConfig('simple.inmem.invalid.bad.schema.syntax')
  await triggerReload() // make server pick it up. it should still use the old valid config

  const res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {listNotes: []}) // no data since no mutation is executed
})

test.serial('should use prev config when there is a resolver not in the new schema', async t => {
  // delete everything and feed a valid config
  await deleteConfig()
  await triggerReload() // make server pick it up: it will use the default empty schema

  // delete everything and feed an invalid config
  await deleteConfig()
  await feedConfig('simple.inmem.invalid.resolver.not.in.schema')
  await triggerReload() // make server try to pick it up. it should still use the the empty schema

  let res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.truthy(res.errors)
  t.falsy(res.data)

  // default empty schema has a Query defined with name '_'
  res = await fetch({
    query: '{ _ }'
  })

  t.falsy(res.errors)
})

// Apollo doesn't complain about this case in advance!
test.serial('should return null when executing a query with missing resolver', async t => {
  // delete everything and feed the config
  await deleteConfig()
  await feedConfig('simple.inmem.invalid.notes.no.resolver.for.query')
  await triggerReload() // make server try to pick it up. it should be able to use the new schema.

  let res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {listNotes: []}) // no data since no mutation is executed

  res = await fetch({
    query: '{ foo }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {foo: null})
})

test.serial('should return error when calling a query that does not exist', async t => {
  // delete everything and feed the config
  await deleteConfig()
  await feedConfig('simple.inmem.valid.notes')
  await triggerReload()

  let res = await fetch({
    query: '{ listNotes {id} }'
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, {listNotes: []}) // no data since no mutation is executed

  res = await fetch({
    query: '{ FOO }'
  })

  t.truthy(res.errors)
  t.falsy(res.data)
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
