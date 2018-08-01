const { test } = require('ava')
const Helper = require('./helper')
const TestApolloClient = require('./util/testApolloClient')
const gql = require('graphql-tag')

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

test.serial('resolvers can be configured to publish notifications to custom topics', async (t) => {
  const { apolloClient, helper } = context
  const customTopic = 'myCustomTopic'

  const pubsubNotification = helper.listenForPubsubNotification(customTopic)

  const publish = JSON.stringify({
    topic: customTopic,
    payload: `{
      "memeAdded": {{ toJSON context.result }}
    }`
  })

  await helper.models.Resolver.update({ publish }, { where: { field: 'createMeme' } })

  await helper.syncService.restart()

  await apolloClient.client.mutate({
    // language=GraphQL
    mutation: gql`
      mutation {
          createMeme (
            ownerId: "1",
              photoUrl:"https://example.com/meme.jpg"
          ) {
              id,
              photoUrl,
              ownerId
          }
      }
  `
  })

  const pubsubResult = await pubsubNotification
  t.truthy(pubsubResult)
})

test.serial('resolvers can be configured to publish custom payloads to the pubsub layer', async (t) => {
  const { apolloClient, helper } = context
  const customTopic = 'myCustomTopic'

  const pubsubNotification = helper.listenForPubsubNotification(customTopic)

  const publish = JSON.stringify({
    topic: customTopic,
    payload: `{
      "memeAdded": {{ toJSON context.result }},
      "someCustomField": "some custom value"
    }`
  })

  await helper.models.Resolver.update({ publish }, { where: { field: 'createMeme' } })

  await helper.syncService.restart()

  await apolloClient.client.mutate({
    // language=GraphQL
    mutation: gql`
      mutation {
          createMeme (
              ownerId: "1",
              photoUrl:"https://example.com/meme.jpg"
          ) {
              id,
              photoUrl,
              ownerId
          }
      }
  `
  })

  let result = await pubsubNotification
  t.log(result)

  // asserting the main test case that custom fields can be defined in payload
  t.truthy(result.someCustomField)
  t.deepEqual(result.someCustomField, 'some custom value')
})
