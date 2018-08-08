const {test} = require('ava')
const {wrapResolverWithHooks} = require('./wrapResolverWithHooks')

test('it should check the prehoook url', t => {
  let originalResolver = function () {
    return new Promise((resolve) => {
      return resolve()
    })
  }

  const resolverMapping = {
    preHook: 'http://prehook.com'
  }

  const requestObject = {
    post: function (url) {
      t.deepEqual(url, 'http://prehook.com')
      return new Promise(function (resolve, reject) { })
    }
  }

  const wrappedResolver = wrapResolverWithHooks(originalResolver, resolverMapping, requestObject)

  t.truthy(wrappedResolver)
  t.deepEqual(typeof wrappedResolver, 'function')
  return wrappedResolver()
})

test('it should check the posthoook url', t => {
  let originalResolver = function () {
    return new Promise((resolve) => {
      return resolve()
    })
  }

  const resolverMapping = {
    postHook: 'http://posthook.com'
  }

  const requestObject = {
    post: function (url) {
      t.deepEqual(url, 'http://posthook.com')
      return new Promise(function (resolve, reject) { })
    }
  }

  const wrappedResolver = wrapResolverWithHooks(originalResolver, resolverMapping, requestObject)

  t.truthy(wrappedResolver)
  t.deepEqual(typeof wrappedResolver, 'function')
  return wrappedResolver()
})
