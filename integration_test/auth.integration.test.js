const { test } = require('ava')
const base = require('./datasource.integration.test.base')

const context = {
  helper: undefined,
  testNote: 'auth, inmem'
}

test.before(async t => {
  process.env.KEYCLOAK_CONFIG_FILE = require('path').resolve('./keycloak/keycloak.json')
  const Helper = require('./helper')
  const helper = new Helper()

  await helper.initialize()

  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.feedConfig('auth.complete.inmem.valid.memeo')
  await helper.triggerReload()

  context.helper = helper
})

base(context)
