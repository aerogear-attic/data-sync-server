const {test} = require('ava')
const base = require('./datasource.integration.test.base')

const context = {
  helper: undefined
}

test.before(async t => {
  const Helper = require('./helper')
  const helper = new Helper()

  await helper.initialize()

  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.feedConfig('complete.inmem.valid.memeo')
  await helper.triggerReload()

  context.helper = helper
})

base(context)
