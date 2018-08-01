const { test } = require('ava')
const gql = require('graphql-tag')
const RestartableSyncService = require('./util/restartableSyncService')
const TestApolloClient = require('./util/testApolloClient')
const config = require('../server/config')

module.exports = (context) => {
  test.serial('clients should receive updates from subscription resolvers', async (t) => {
    const { apolloClient } = context

    let subscription = apolloClient.subscribe(gql`
      subscription memeAdded {
        memeAdded {
          photoUrl,
          ownerId,
          id
        }
      }
    `)

    const profileId = '1'
    const photoUrl = 'https://example.com/meme.jpg'

    await apolloClient.client.mutate({
      // language=GraphQL
      mutation: gql`
        mutation {
            createMeme (
                ownerId: "${profileId}",
                photoUrl:"${photoUrl}"
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
    t.deepEqual(result.data.memeAdded.photoUrl, photoUrl)
    t.deepEqual(result.data.memeAdded.ownerId, profileId)
  })

  test.serial('subscriptions work across server instances', async (t) => {
    const serviceA = new RestartableSyncService({ ...config, server: { port: 8001 } })
    const serviceB = new RestartableSyncService({ ...config, server: { port: 8002 } })

    const clientA = new TestApolloClient('localhost:8001')
    const clientB = new TestApolloClient('localhost:8002')

    await serviceA.initialize()
    await serviceB.initialize()

    await serviceA.start()
    await serviceB.start()

    let subscription = clientA.subscribe(gql`
      subscription memeAdded {
        memeAdded {
          photoUrl,
          ownerId,
          id
        }
      }
    `)

    const profileId = '1'
    const photoUrl = 'https://example.com/meme.jpg'

    await clientB.client.mutate({
      // language=GraphQL
      mutation: gql`
        mutation {
            createMeme (
                ownerId: "${profileId}",
                photoUrl:"${photoUrl}"
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
    t.deepEqual(result.data.memeAdded.photoUrl, photoUrl)
    t.deepEqual(result.data.memeAdded.ownerId, profileId)
  })

  test.serial('subscriptions can use a filtering mechanism', async (t) => {
    const { apolloClient, helper } = context

    const filter = {
      'eq': ['$payload.memeAdded.photoUrl', '$variables.photoUrl']
    }

    const testPhotoUrl = 'http://testing.com'
    const profileId = '1'

    await helper.models.Subscription.update({ filter }, { where: { field: 'memeAdded' } })

    await helper.syncService.restart()

    let subscription = apolloClient.subscribe(gql`
      subscription memeAdded {
        memeAdded(photoUrl: "${testPhotoUrl}") {
          photoUrl,
          ownerId,
          id
        }
      }
    `)

    await apolloClient.client.mutate({
      // language=GraphQL
      mutation: gql`
        mutation {
            createMeme (
                ownerId: "${profileId}",
                photoUrl:"${testPhotoUrl}"
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
    t.deepEqual(result.data.memeAdded.photoUrl, testPhotoUrl)
    t.deepEqual(result.data.memeAdded.ownerId, profileId)
  })

  test.serial('subscriptions will not receive updates when filters evaluate false', async (t) => {
    const { apolloClient, helper } = context

    const filter = {
      'eq': ['$payload.memeAdded.photoUrl', '$variables.photoUrl']
    }

    const payloadUrl = 'http://someurl.com'
    const variablesUrl = 'http://someotherurl.com'

    const profileId = '1'

    await helper.models.Subscription.update({ filter }, { where: { field: 'memeAdded' } })

    await helper.syncService.restart()

    let subscription = apolloClient.subscribe(gql`
      subscription memeAdded {
        memeAdded(photoUrl: "${variablesUrl}") {
          photoUrl,
          ownerId,
          id
        }
      }
    `)

    await apolloClient.client.mutate({
      // language=GraphQL
      mutation: gql`
        mutation {
            createMeme (
                ownerId: "${profileId}",
                photoUrl:"${payloadUrl}"
            ) {
                id,
                photoUrl,
                ownerId
            }
        }
    `
    })

    await t.throws(async () => {
      await subscription
    })
  })
}
