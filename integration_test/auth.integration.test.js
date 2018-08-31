const { test } = require('ava')
const gql = require('graphql-tag')
const auth = require('./util/auth')

const context = {
  helper: undefined,
  testNote: 'auth, inmem'
}

async function authTestAdmin (context) {
  const authHeaders = await auth.authenticateKeycloak('test-admin', 'test123')
  context.helper.resetApolloClient(authHeaders)
}

test.before(async t => {
  process.env.KEYCLOAK_CONFIG_FILE = require('path').resolve('./keycloak/keycloak.json')
  const Helper = require('./helper')
  const helper = new Helper()

  await helper.initialize()
  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.feedConfig('complete.inmem.valid.memeo')
  await helper.triggerReload()

  context.helper = helper
})

test.beforeEach(async () => {
  context.helper.resetApolloClient()
})

test.serial(`should return empty list when no Profiles created yet (${context.testNote})`, async t => {
  await authTestAdmin(context)

  const res = await context.helper.apolloClient.client.query({
    // language=GraphQL
    query: gql`{
        allProfiles {
            id
        }
      }`
  })

  t.falsy(res.errors)
  t.deepEqual(res.data, { allProfiles: [] })
})

test.serial(`should create a Profile (${context.testNote})`, async t => {
  await authTestAdmin(context)

  let res = await context.helper.apolloClient.client.mutate({
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

  t.log(res)

  t.falsy(res.errors)
  t.truthy(res.data.createProfile)
  t.truthy(res.data.createProfile.id)
  t.deepEqual(res.data.createProfile.email, 'jordan@example.com')
  t.deepEqual(res.data.createProfile.displayName, 'Michael Jordan')
  t.deepEqual(res.data.createProfile.biography, 'Nr #23!')
  t.deepEqual(res.data.createProfile.avatarUrl, 'http://example.com/mj.jpg')

  const createdId = res.data.createProfile.id

  res = await context.helper.apolloClient.client.query({
    // language=GraphQL
    query: gql`{
        allProfiles{
            id
        }
        }`
  })
  t.falsy(res.errors)
  t.truthy(res.data.allProfiles)
  t.is(res.data.allProfiles.length, 1)
  t.is(res.data.allProfiles[0].id, createdId)
})
