const { test } = require('ava')
const AuthContextProvider = require('./AuthContextProvider')

test('provider.getToken() returns request.kauth.grant.access_token', (t) => {
  const token = {
    someField: 'foo'
  }
  const request = {
    kauth: {
      grant: {
        access_token: token
      }
    }
  }

  const provider = new AuthContextProvider(request)
  t.truthy(provider.getToken())
  t.deepEqual(provider.request, request)
  t.deepEqual(provider.getToken(), token)
})

test('provider.getToken() returns null when request.kauth is not available', (t) => {
  const request = {}

  const provider = new AuthContextProvider(request)
  t.falsy(provider.getToken())
})
