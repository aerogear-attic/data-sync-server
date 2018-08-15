const {test} = require('ava')
const {wrapResolverWithHooks} = require('./wrapResolverWithHooks')

test('it should check the prehoook url', t => {
  // mock arguments for a GraphQL resolver function
  const obj = {}
  const args = { hello: 'world' }
  const context = {}
  const info = {
    operation: {
      operation: 'someOperation'
    },
    parentType: {
      name: 'someName'
    },
    fieldName: 'someField'
  }

  let expectedResolverResult = 'some result'

  let originalResolver = function () {
    return new Promise((resolve) => {
      return resolve(expectedResolverResult)
    })
  }

  const resolverMapping = {
    preHook: 'http://prehook.com'
  }

  const httpClient = {
    post: function (url, payload) {
      t.deepEqual(url, 'http://prehook.com')
      t.deepEqual(payload.args, args)
      return new Promise(function (resolve, reject) { })
    }
  }

  const wrappedResolver = wrapResolverWithHooks(originalResolver, resolverMapping, httpClient)

  t.truthy(wrappedResolver)
  t.deepEqual(typeof wrappedResolver, 'function')
  return wrappedResolver(obj, args, context, info)
})

test('it should check the posthoook url', t => {
  // mock arguments for a GraphQL resolver function
  const obj = {}
  const args = { hello: 'world' }
  const context = {}
  const info = {
    operation: {
      operation: 'someOperation'
    },
    parentType: {
      name: 'someName'
    },
    fieldName: 'someField'
  }

  let expectedResolverResult = 'some result'

  let originalResolver = function () {
    return new Promise((resolve) => {
      return resolve(expectedResolverResult)
    })
  }

  const resolverMapping = {
    postHook: 'http://posthook.com'
  }

  const httpClient = {
    post: function (url, payload) {
      t.deepEqual(url, 'http://posthook.com')
      t.deepEqual(payload.result, expectedResolverResult)
      return new Promise(function (resolve, reject) { })
    }
  }

  const wrappedResolver = wrapResolverWithHooks(originalResolver, resolverMapping, httpClient)

  t.truthy(wrappedResolver)
  t.deepEqual(typeof wrappedResolver, 'function')
  return wrappedResolver(obj, args, context, info)
})
