const { test } = require('ava')
const axios = require('axios')
const DataSyncService = require('../DataSyncService')
const config = require('../server/config')

test.serial('The DataSyncService class successfully initializes and starts', async (t) => {
  config.server.port = 0 // specifying port 0 gives us a random port number to make sure it doesn't conflict with anything
  t.plan(2)
  const syncService = new DataSyncService(config)
  await syncService.initialize()
  await syncService.start()

  let { port } = syncService.app.server.address()

  const response = await axios.get(`http://localhost:${port}/healthz`)
  t.deepEqual(response.status, 200)
  t.pass()
})
