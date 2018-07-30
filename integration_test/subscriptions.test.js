const { test } = require('ava')
const RestartableSyncService = require('./util/restartableSyncService')
const Helper = require('./helper')
const TestApolloClient = require('./util/testApolloClient')
const config = require('../server/config')
const gql = require('graphql-tag')


let apolloClient = null
let helper = null
let syncService = null

test.before(async t => {
  apolloClient = new TestApolloClient()
  helper = new Helper()
  syncService = new RestartableSyncService(config)

  await helper.initialize()

  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.feedConfig('complete.inmem.valid.memeo.js')

  await syncService.initialize()
  await syncService.start()
  await new Promise(resolve => setTimeout(resolve, 1000))
})

test.serial('testing subscriptions', async (t) => {

  let subscription = apolloClient.subscribe(gql`
    subscription memeAdded {
      memeAdded {
        photoUrl,
        ownerId,
        id
      }
    }
  `)

  let res = await helper.fetch({
    // language=GraphQL
    query: `
      mutation {
          createMeme (
              ownerId: "someId",
              photoUrl:"https://example.com/meme.jpg"
          ) {
              id,
              photoUrl,
              ownerId
          }
      }
  `
  })

  let result = await subscription

  t.truthy(result.data.memeAdded)
})

