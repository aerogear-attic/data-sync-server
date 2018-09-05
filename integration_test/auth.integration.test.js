const { test } = require('ava')
const auth = require('./util/auth')
const axios = require('axios')
const gqls = require('./auth.integration.test.gql')

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
  await helper.feedConfig('auth.complete.inmem.valid.memeo')
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

  const res = await context.helper.apolloClient.client.query(gqls.allProfiles)
  t.falsy(res.errors)
  t.deepEqual(res.data, { allProfiles: [] })
})

const checkProfile = (t, res, mutationName) => {
  t.falsy(res.errors)
  t.truthy(res.data[mutationName])
  t.truthy(res.data[mutationName].id)
  t.deepEqual(res.data[mutationName].email, 'jordan@example.com')
  t.deepEqual(res.data[mutationName].displayname, 'Michael Jordan')
  t.deepEqual(res.data[mutationName].pictureurl, 'http://example.com/mj.jpg')
}

test.serial(`should create a Profile with proper client role (${context.testNote})`, async t => {
  await authenticate(t, 'test-admin', 'test123')

  let res = await context.helper.apolloClient.client.mutate(gqls.profileMutation('createProfile'))

  checkProfile(t, res, 'createProfile')

  t.log(res)

  const createdId = res.data.createProfile.id

  res = await context.helper.apolloClient.client.query(gqls.allProfiles)
  t.falsy(res.errors)
  t.truthy(res.data.allProfiles)
  t.is(res.data.allProfiles.length, 1)
  t.is(res.data.allProfiles[0].id, createdId)
})

const checkForbidden = async (t, exception) => {
  t.truthy(exception.graphQLErrors)
  t.is(exception.graphQLErrors[0].extensions.code, 'FORBIDDEN')
}

const checkProfileCount = async (t, count) => {
  let res = await context.helper.apolloClient.client.query(gqls.allProfiles)
  t.falsy(res.errors)
  t.truthy(res.data.allProfiles)
  t.is(res.data.allProfiles.length, count)
}

test.serial(`shouldn't create a Profile without proper client role (${context.testNote})`, async t => {
  await authenticate(t, 'test-voter', 'test123')
  try {
    await context.helper.apolloClient.client.mutate(gqls.profileMutation('createProfile'))
    t.fail('Profile was created without proper role')
  } catch (e) {
    await checkForbidden(t, e)
  }
  await checkProfileCount(t, 1)
})

test.serial(`shouldn't create a Profile without proper realm role (${context.testNote})`, async t => {
  await authenticate(t, 'test-voter', 'test123')

  try {
    await context.helper.apolloClient.client.mutate(gqls.profileMutation('createProfileRealm'))
    t.fail('Profile was created without proper role')
  } catch (e) {
    await checkForbidden(t, e)
  }
  await checkProfileCount(t, 1)
})

test.serial(`should create a Profile with proper realm role (${context.testNote})`, async t => {
  await authenticate(t, 'test-realm-role', 'test123')

  let res = await context.helper.apolloClient.client.mutate(gqls.profileMutation('createProfileRealm'))
  checkProfile(t, res, 'createProfileRealm')

  await checkProfileCount(t, 2)
})
