const { test } = require('ava')
const gql = require('graphql-tag')
const RestartableSyncService = require('./util/restartableSyncService')
const TestApolloClient = require('./util/testApolloClient')
const config = require('../server/config')

module.exports = (context) => {
  test.serial('clients should receive updates from subscription resolvers', async (t) => {
    const { apolloClient, helper } = context

    let subscription = apolloClient.subscribe(gql`
      subscription memeAdded {
        memeAdded {
          photoUrl,
          ownerId,
          id
        }
      }
    `)

    let res = await context.helper.fetch({
      // language=GraphQL
      query: `
          mutation {
              createProfile (
                  email: "jordan@example.com",
                  displayName: "Michael Jordan",
                  biography:"Nr #23!",
                  avatarUrl:"http://example.com/mj.jpg"
              ) {
                  id,
                  email,
                  displayName,
                  biography,
                  avatarUrl
              }
          }
      `
    })

    t.falsy(res.errors)
    t.truthy(res.data.createProfile)
    t.truthy(res.data.createProfile.id)

    const profileId = res.data.createProfile.id
    const photoUrl = 'https://example.com/meme.jpg'

    res = await helper.fetch({
      // language=GraphQL
      query: `
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

    let res = await clientB.client.mutate({
      // language=GraphQL
      mutation: gql`
          mutation {
              createProfile (
                  email: "jordan@example.com",
                  displayName: "Michael Jordan",
                  biography:"Nr #23!",
                  avatarUrl:"http://example.com/mj.jpg"
              ) {
                  id,
                  email,
                  displayName,
                  biography,
                  avatarUrl
              }
          }
      `
    })

    t.falsy(res.errors)
    t.truthy(res.data.createProfile)
    t.truthy(res.data.createProfile.id)

    const profileId = res.data.createProfile.id
    const photoUrl = 'https://example.com/meme.jpg'

    res = await clientB.client.mutate({
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
}
