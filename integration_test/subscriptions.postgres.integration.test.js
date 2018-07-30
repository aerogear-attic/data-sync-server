const { test } = require('ava')
const Helper = require('./helper')
const TestApolloClient = require('./util/testApolloClient')
const base = require('./subscriptions.integration.test.base')

const context = {
  apolloClient: null,
  helper: null
}

test.before(async t => {
  context.apolloClient = new TestApolloClient()
  const helper = new Helper()

  await helper.initialize()

  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.feedConfig('complete.postgres.valid.memeo.js')
  await helper.syncService.restart()
  context.helper = helper
})

base(context)
