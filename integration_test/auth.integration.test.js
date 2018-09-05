const { test } = require('ava')
const gql = require('graphql-tag')
const auth = require('./util/auth')
const axios = require('axios')

const context = {
  helper: undefined,
  testNote: 'auth, inmem'
}

async function authenticate (test, username, password) {
  test.log(`Authenticating as ${username}`)
  const authHeaders = await auth.authenticateKeycloak(username, password)
  context.helper.resetApolloClient(authHeaders)
  test.log(`Authenticated as ${username}`)
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
  context.keycloakConfig = require(process.env.KEYCLOAK_CONFIG_FILE)
})

test.beforeEach(async (t) => {
  context.helper.resetApolloClient()
  t.log('Cleared authentication headers')
})

test.serial(`not authenticated query should fail (${context.testNote}`, async t => {
  let { port } = context.helper.syncService.app.server.address()

  try {
    await axios({method: 'post',
      url: `http://localhost:${port}/graphql`,
      data: { query: '{ allProfiles { id } }' },
      maxRedirects: 0})
    // shall not pass here, should be redirected to Keycloak, throws exception
    t.fail('unauthenticated request passed')
  } catch (e) {
    t.deepEqual(e.response.status, 302, 'Improper HTTP redirection to Keycloak')
    t.regex(e.response.headers.location, new RegExp(`^${context.keycloakConfig['auth-server-url']}.*`), 'Keycloak url not matching for the redirect')
  }
})

test.serial(`should return empty list when no Profiles created yet (${context.testNote})`, async t => {
  await authenticate(t, 'test-admin', 'test123')

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
  await authenticate(t, 'test-admin', 'test123')

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
