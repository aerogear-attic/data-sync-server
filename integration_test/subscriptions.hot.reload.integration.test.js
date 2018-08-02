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
  await helper.cleanMemeolistDatabase(t)
  await helper.syncService.restart()
  context.helper = helper
})

test.serial('Newly added subscriptions should be hot reloaded', async (t) => {
  const { helper, apolloClient } = context

  const newSchemaString = `

    type Profile {
        id: ID! @isUnique
        email: String! @isUnique
        displayName: String!
        biography: String!
        avatarUrl: String!
        memes: [Meme]!
    }

    type Meme {
        id: ID! @isUnique
        photoUrl: String!
        ownerId: String!
    }

    type Query {
        allProfiles:[Profile!]!
        profile(email: String!):Profile
        allMemes:[Meme!]!
    }

    type Mutation {
        createProfile(email: String!, displayName: String!, biography: String!, avatarUrl: String!):Profile!
        updateProfile(id: ID!, email: String!, displayName: String!, biography: String!, avatarUrl: String!):Profile
        deleteProfile(id: ID!):Boolean!
        createMeme(ownerId: String!, photoUrl: String!):Meme!
    }

    type Subscription {
      memeAdded(photoUrl: String):Meme!
      profileAdded:Profile
    }

  `

  const newSubscription = {
    type: 'Subscription',
    field: 'profileAdded',
    GraphQLSchemaId: 2
  }

  const publish = newSubscription.field

  // update existing schema, subscriptions and resolvers to enable a 'profileAdded' subscription
  await helper.models.GraphQLSchema.update({ schema: newSchemaString }, { where: { name: 'default' } })
  await helper.models.Subscription.build(newSubscription).save()
  await helper.models.Resolver.update({ publish }, { where: { field: 'createProfile' } })

  // trigger the hot reload
  await context.helper.triggerReload()

  // let's try test that our new subscription works
  let subscription = apolloClient.subscribe(gql`
    subscription profileAdded {
      profileAdded {
        id,
        email,
        displayName,
        biography,
        avatarUrl
      }
    }
  `)

  await apolloClient.client.mutate({
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

  let result = await subscription

  t.truthy(result)
  t.truthy(result.data.profileAdded)
})
