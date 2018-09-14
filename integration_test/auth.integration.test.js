process.env.KEYCLOAK_CONFIG_FILE = require('path').resolve('./integration_test/config/keycloak.json')
const { test } = require('ava')
const auth = require('./util/auth')
const axios = require('axios')
const gqls = require('./auth.integration.test.gql')
const localKeycloak = require('./auth.integration.test.keycloak')

const context = {
  helper: undefined,
  testNote: 'auth, inmem',
  testPassword: 'admin',
  keycloakConfig: require(process.env.KEYCLOAK_CONFIG_FILE)
}

function modifyKeycloakServerUrl (url) {
  const fs = require('fs')

  context.keycloakConfig['auth-server-url'] = url
  fs.writeFileSync(process.env.KEYCLOAK_CONFIG_FILE, JSON.stringify(context.keycloakConfig))
}

async function authenticate (test, username, password) {
  test.log(`Authenticating as ${username}`)
  const authHeaders = await auth.authenticateKeycloak(context.keycloakConfig, username, password)
  context.helper.resetApolloClient(authHeaders)
  test.log(`Authenticated as ${username}`)
}

test.before(async t => {
  // Used in Circle CI
  if (process.env.KEYCLOAK_HOST && process.env.KEYCLOAK_PORT) {
    modifyKeycloakServerUrl(`http://${process.env.KEYCLOAK_HOST}:${process.env.KEYCLOAK_PORT}/auth`)
  }
  await localKeycloak.prepareKeycloak(context.keycloakConfig['auth-server-url'])
  const Helper = require('./helper')
  const helper = new Helper()
  await helper.initialize()
  // delete the all the config 1-time before starting the tests
  await helper.deleteConfig()
  await helper.feedConfig('auth.complete.inmem.valid.memeo')
  await helper.triggerReload()

  context.helper = helper
})

test.after.always(async t => {
  await localKeycloak.resetKeycloakConfiguration()
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
  await authenticate(t, 'test-admin', context.testPassword)
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

test.serial(`should create a Profile  with proper client role  (mutation client hasRole check) (${context.testNote})`, async t => {
  await authenticate(t, 'test-admin', context.testPassword)

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

const checkForbidden = (t, exception) => {
  t.truthy(exception.graphQLErrors)
  t.is(exception.graphQLErrors[0].extensions.code, 'FORBIDDEN')
}

const checkProfileCount = async (t, count) => {
  let res = await context.helper.apolloClient.client.query(gqls.allProfiles)
  t.falsy(res.errors)
  t.truthy(res.data.allProfiles)
  t.is(res.data.allProfiles.length, count)
}

test.serial(`shouldn't create a Profile without proper client role (mutation client hasRole check) (${context.testNote})`, async t => {
  await authenticate(t, 'test-voter', context.testPassword)
  try {
    await context.helper.apolloClient.client.mutate(gqls.profileMutation('createProfile'))
    t.fail('Profile was created without proper role')
  } catch (e) {
    checkForbidden(t, e)
  }
  await checkProfileCount(t, 1)
})

test.serial(`shouldn't create a Profile without proper realm role (mutation realm hasRole check) (${context.testNote})`, async t => {
  await authenticate(t, 'test-voter', context.testPassword)

  try {
    await context.helper.apolloClient.client.mutate(gqls.profileMutation('createProfileRealm'))
    t.fail('Profile was created without proper role')
  } catch (e) {
    checkForbidden(t, e)
  }
  await checkProfileCount(t, 1)
})

test.serial(`should create a Profile with proper realm role (mutation realm hasRole check) (${context.testNote})`, async t => {
  await authenticate(t, 'test-realm-role', context.testPassword)

  let res = await context.helper.apolloClient.client.mutate(gqls.profileMutation('createProfileRealm'))
  checkProfile(t, res, 'createProfileRealm')

  await checkProfileCount(t, 2)
})

const createMeme = async t => {
  const meme = await context.helper.apolloClient.client.mutate(gqls.createMeme(1))
  t.truthy(meme.data.createMeme.id)
  return meme
}

test.serial(`should be able to like a meme with proper role (hasRole array-check) (${context.testNote})`, async t => {
  const likeAndCheckCount = async () => {
    const meme = await createMeme(t)

    let likeCount = meme.data.createMeme.likes
    await context.helper.apolloClient.client.mutate(gqls.likeMeme(meme.data.createMeme.id))

    let memes = await context.helper.apolloClient.client.query(gqls.allMemes(false))
    const newMeme = memes.data.allMemes.filter(m => m.id === meme.data.createMeme.id)[0]
    t.truthy(newMeme)
    t.is(newMeme.likes, likeCount + 1)
  }

  await authenticate(t, 'test-voter', context.testPassword)
  await likeAndCheckCount()

  await authenticate(t, 'test-voter2', context.testPassword)
  await likeAndCheckCount()
})

test.serial(`shouldn't be able to like a meme without proper role (hasRole array-check) (${context.testNote})`, async t => {
  await authenticate(t, 'test-norole', context.testPassword)
  const meme = await createMeme(t)

  let likeCount = meme.data.createMeme.likes
  try {
    await context.helper.apolloClient.client.mutate(gqls.likeMeme(meme.data.createMeme.id))
    t.fail('Meme was created without proper role')
  } catch (e) {
    checkForbidden(t, e)
    let memes = await context.helper.apolloClient.client.query(gqls.allMemes(false))
    const newMeme = memes.data.allMemes.filter(m => m.id === meme.data.createMeme.id)[0]
    t.truthy(newMeme)
    t.is(newMeme.likes, likeCount)
  }
})

test.serial(`querying all comments with proper role (query hasRole check) (${context.testNote})`, async t => {
  await authenticate(t, 'test-admin', context.testPassword)
  const meme = await createMeme(t)

  let text = 'Lorem ipsum'
  const comment1 = await context.helper.apolloClient.client.mutate(gqls.postComment(meme.data.createMeme.id, text, 1))
  t.truthy(comment1.data)
  t.falsy(comment1.errors)
  t.is(comment1.data.postComment.comment, text)

  text = 'Lorem ipsum2'
  const comment2 = await context.helper.apolloClient.client.mutate(gqls.postComment(meme.data.createMeme.id, text, 1))
  t.truthy(comment2.data)
  t.falsy(comment2.errors)
  t.is(comment2.data.postComment.comment, text)
  const res = await context.helper.apolloClient.client.query(gqls.allComments)

  t.falsy(res.errors)
  t.truthy(res.data.allComments)

  const filtered = res.data.allComments.filter(c => (c.id === comment1.data.postComment.id || c.id === comment2.data.postComment.id))
  t.is(filtered.length, 2)
})

test.serial(`querying all comments without proper role (query hasRole check) (${context.testNote})`, async t => {
  await authenticate(t, 'test-norole', context.testPassword)

  try {
    await context.helper.apolloClient.client.query(gqls.allComments)
    t.fail('allComments shouldn\'t be able to query with this role')
  } catch (e) {
    checkForbidden(t, e)
  }
})

test.serial(`query allMemes without field protected by hasRole (${context.testNote})`, async t => {
  await authenticate(t, 'test-norole', context.testPassword)

  const res = await context.helper.apolloClient.client.query(gqls.allMemes(false))
  t.truthy(res.data.allMemes)
  if (res.data.allMemes.length === 0) {
    t.fail('allMemes field is empty, there should be some meme created')
  }
})

test.serial(`query allMemes with field protected by hasRole and invalid role (${context.testNote})`, async t => {
  await authenticate(t, 'test-norole', context.testPassword)
  try {
    await context.helper.apolloClient.client.query(gqls.allMemes(true))
    t.fail('query should be denied for this role')
  } catch (e) {
    checkForbidden(t, e)
  }
})

test.serial(`query allMemes with field protected by hasRole and valid role (${context.testNote})`, async t => {
  await authenticate(t, 'test-admin', context.testPassword)
  const res = await context.helper.apolloClient.client.query(gqls.allMemes(true))
  t.truthy(res.data.allMemes)
  if (res.data.allMemes.length === 0) {
    t.fail('allMemes field is empty, there should be some meme created')
  }
  t.truthy(res.data.allMemes[0].comments, 'Field doesn\'t contain comments')
})
