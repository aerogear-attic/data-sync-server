const { test } = require('ava')
const gql = require('graphql-tag')

let helper

// also trigger a hot reload with that
test.before(async t => {
  const Helper = require('./helper')
  helper = new Helper()

  await helper.initialize()

  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.triggerReload()
})

test.serial('should run with default empty schema when no config provided', async t => {
  // default empty schema has a Query defined with name '_'
  const res = await helper.apolloClient.client.query({
    query: gql`{ _ }`
  })

  t.truthy(res)
})

test.serial('should run with default empty schema when no provided config has empty schema', async t => {
  await helper.deleteConfig()
  await helper.feedConfig('simple.inmem.valid.empty.schema')
  await helper.triggerReload()

  // default empty schema has a Query defined with name '_'
  const res = await helper.apolloClient.client.query({
    query: gql`{ _ }`
  })

  t.truthy(res)
})

test.serial('should pick up config changes', async t => {
  const query = helper.apolloClient.client.query({
    query: gql`{ listNotes {id} }`
  })

  t.throws(query)

  await helper.deleteConfig()
  await helper.feedConfig('simple.inmem.valid.notes')
  await helper.triggerReload()

  let res = await helper.apolloClient.client.query({
    query: gql`{ listNotes {id} }`
  })

  t.deepEqual(res.data, { listNotes: [] }) // no data since no mutation is executed
})

test.serial('should use prev config when there is a schema syntax problem with the new config', async t => {
  // delete everything and feed a valid config
  await helper.deleteConfig()
  await helper.feedConfig('simple.inmem.valid.notes')
  await helper.triggerReload() // make server pick it up

  // delete everything and feed an invalid config
  await helper.deleteConfig()
  await helper.feedConfig('simple.inmem.invalid.bad.schema.syntax')
  await helper.triggerReload() // make server pick it up. it should still use the old valid config

  const res = await helper.apolloClient.client.query({
    query: gql`{ listNotes {id} }`
  })

  t.deepEqual(res.data, { listNotes: [] }) // no data since no mutation is executed
})

test.serial('should not complain when there is a resolver not in the new schema', async t => {
  // delete everything and feed a valid config
  await helper.deleteConfig()
  await helper.triggerReload() // make server pick it up: it will use the default empty schema

  // delete everything and feed an invalid config
  await helper.deleteConfig()
  await helper.feedConfig('simple.inmem.valid.resolver.not.in.schema')
  // make server try to pick it up.
  // it should use the the new schema even though there is a resolver not in the schema
  await helper.triggerReload()

  const query = helper.apolloClient.client.query({
    query: gql`{ listNotes {id} }`
  })

  t.throws(query)

  // default empty schema has a Query defined with name '_'
  const res = await helper.apolloClient.client.query({
    query: gql`{ someQuery }`
  })

  t.truthy(res)
})

// Apollo doesn't complain about this case in advance!
test.serial('should return null when executing a query with missing resolver', async t => {
  // delete everything and feed the config
  await helper.deleteConfig()
  await helper.feedConfig('simple.inmem.invalid.notes.no.resolver.for.query')
  await helper.triggerReload() // make server try to pick it up. it should be able to use the new schema.

  let res = await helper.apolloClient.client.query({
    query: gql`{ listNotes {id} }`
  })

  t.deepEqual(res.data, { listNotes: [] }) // no data since no mutation is executed

  res = await helper.apolloClient.client.query({
    query: gql`{ foo }`
  })

  t.deepEqual(res.data, { foo: null })
})

test.serial('should return error when calling a query that does not exist', async t => {
  // delete everything and feed the config
  await helper.deleteConfig()
  await helper.feedConfig('simple.inmem.valid.notes')
  await helper.triggerReload()

  const res = await helper.apolloClient.client.query({
    query: gql`{ listNotes {id} }`
  })

  t.deepEqual(res.data, { listNotes: [] }) // no data since no mutation is executed

  const query = helper.apolloClient.client.query({
    query: gql`{ FOO }`
  })

  return t.throws(query)
})
