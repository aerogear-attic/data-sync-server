const {test} = require('ava')

/// //////////////// NOTE /////////////////////////////////////
/// /////////// order of tests are imporant!///////////////////
/// //////////////// NOTE /////////////////////////////////////

module.exports = function (context) {
  test.serial('should return empty list when no Profiles created yet', async t => {
    const res = await context.helper.fetch({
      // language=GraphQL
      query: `{
          allProfiles{
              id
          }
      }`
    })

    t.falsy(res.errors)
    t.deepEqual(res.data, {allProfiles: []})
  })

  test.serial('should create a Profile', async t => {
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
    t.deepEqual(res.data.createProfile.email, 'jordan@example.com')
    t.deepEqual(res.data.createProfile.displayName, 'Michael Jordan')
    t.deepEqual(res.data.createProfile.biography, 'Nr #23!')
    t.deepEqual(res.data.createProfile.avatarUrl, 'http://example.com/mj.jpg')

    const createdId = res.data.createProfile.id

    res = await context.helper.fetch({
      // language=GraphQL
      query: `{
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

  test.serial('should get a Profile by email', async t => {
    let res = await context.helper.fetch({
      // language=GraphQL
      query: `
          query {
              profile (email: "jordan@example.com") {
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
    t.truthy(res.data.profile)
    t.truthy(res.data.profile.id)
    t.deepEqual(res.data.profile.email, 'jordan@example.com')
    t.deepEqual(res.data.profile.displayName, 'Michael Jordan')
    t.deepEqual(res.data.profile.biography, 'Nr #23!')
    t.deepEqual(res.data.profile.avatarUrl, 'http://example.com/mj.jpg')
  })

  test.serial('should update a Profile', async t => {
    let res = await context.helper.fetch({
      // language=GraphQL
      query: `{
          allProfiles{
              id
          }
      }`
    })

    const profileId = res.data.allProfiles[0].id

    t.falsy(res.errors)
    t.truthy(profileId)

    res = await context.helper.fetch({
      // language=GraphQL
      query: `
        mutation {
            updateProfile (
                id: "${profileId}",
                email: "mj@example.com",
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
    t.truthy(res.data.updateProfile)
    t.truthy(res.data.updateProfile.id)
    t.deepEqual(res.data.updateProfile.email, 'mj@example.com')
    t.deepEqual(res.data.updateProfile.displayName, 'Michael Jordan')
    t.deepEqual(res.data.updateProfile.biography, 'Nr #23!')
    t.deepEqual(res.data.updateProfile.avatarUrl, 'http://example.com/mj.jpg')

    res = await context.helper.fetch({
      // language=GraphQL
      query: `{
          allProfiles{
              id,
              email,
              displayName,
              biography,
              avatarUrl
          }
      }`
    })

    t.falsy(res.errors)
    t.truthy(res.data.allProfiles)
    t.is(res.data.allProfiles.length, 1)
    t.is(res.data.allProfiles[0].id, profileId)
    t.deepEqual(res.data.allProfiles[0].email, 'mj@example.com')
    t.deepEqual(res.data.allProfiles[0].displayName, 'Michael Jordan')
    t.deepEqual(res.data.allProfiles[0].biography, 'Nr #23!')
    t.deepEqual(res.data.allProfiles[0].avatarUrl, 'http://example.com/mj.jpg')
  })

  test.serial('should delete a Profile', async t => {
    let res = await context.helper.fetch({
      // language=GraphQL
      query: `{
          allProfiles{
              id
          }
      }`
    })

    const profileId = res.data.allProfiles[0].id

    t.falsy(res.errors)
    t.truthy(profileId)

    res = await context.helper.fetch({
      // language=GraphQL
      query: `
        mutation {
            deleteProfile (
                id: "${profileId}"
            )
        }
    `
    })

    t.falsy(res.errors)
    t.deepEqual(res.data.deleteProfile.true)

    res = await context.helper.fetch({
      // language=GraphQL
      query: `{
          allProfiles{
              id,
              email,
              displayName,
              biography,
              avatarUrl
          }
      }`
    })

    t.falsy(res.errors)
    t.truthy(res.data.allProfiles)
    t.is(res.data.allProfiles.length, 0)
  })

  test.serial('should return empty list when no Memes created yet', async t => {
    const res = await context.helper.fetch({
      // language=GraphQL
      query: `{
          allMemes{
              id
          }
      }`
    })

    t.falsy(res.errors)
    t.deepEqual(res.data, {allMemes: []})
  })

  test.serial('should create a Profile and a Meme', async t => {
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

    res = await context.helper.fetch({
      // language=GraphQL
      query: `
        mutation {
            createMeme (
                ownerId: "${profileId}",
                photoUrl:"http://example.com/meme.jpg"
            ) {
                id,
                photoUrl,
                ownerId
            }
        }
    `
    })

    t.falsy(res.errors)
    t.truthy(res.data.createMeme)
    t.truthy(res.data.createMeme.id)
    t.is(res.data.createMeme.ownerId, profileId)
    t.is(res.data.createMeme.photoUrl, 'http://example.com/meme.jpg')

    const memeId = res.data.createMeme.id

    res = await context.helper.fetch({
      // language=GraphQL
      query: `{
          allMemes{
              id,
              photoUrl,
              ownerId
          }
      }`
    })

    t.falsy(res.errors)
    t.truthy(res.data.allMemes)
    t.is(res.data.allMemes.length, 1)
    t.is(res.data.allMemes[0].id, memeId)
    t.is(res.data.allMemes[0].ownerId, profileId)
    t.is(res.data.allMemes[0].photoUrl, 'http://example.com/meme.jpg')

    res = await context.helper.fetch({
      // language=GraphQL
      query: `
          query {
              profile (email: "jordan@example.com") {
                  id,
                  email,
                  displayName,
                  biography,
                  avatarUrl,
                  memes{
                      id,
                      photoUrl,
                      ownerId
                  }
              }
          }
      `
    })

    t.falsy(res.errors)
    t.truthy(res.data.profile)
    t.truthy(res.data.profile.id)
    t.is(res.data.profile.memes[0].id, memeId)
    t.is(res.data.profile.memes[0].ownerId, profileId)
    t.is(res.data.profile.memes[0].photoUrl, 'http://example.com/meme.jpg')
  })
}
