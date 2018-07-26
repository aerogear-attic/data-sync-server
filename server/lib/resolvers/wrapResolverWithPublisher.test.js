const { test } = require('ava')
const { wrapResolverWithPublish } = require('./wrapResolverWithPublisher')

test('it should wrap the resolver function in a new function that calls the original resolver and publish()', t => {
  t.plan(4)

  let originalResolver = function () {
    return new Promise((resolve) => {
      t.pass()
      return resolve()
    })
  }

  const pubsub = {
    publish: ({ topic, compiledPayload }, { context }) => {
      t.pass()
    }
  }

  const resolverMapping = {
    field: 'testResolver',
    publish: 'testPublish'
  }

  const wrappedResolver = wrapResolverWithPublish(originalResolver, resolverMapping, pubsub)

  t.truthy(wrappedResolver)
  t.deepEqual(typeof wrappedResolver, 'function')
  return wrappedResolver()
})

test('if publish is a simple string, then that string will be used as the publish topic and a default payload will be supplied', t => {
  t.plan(5)

  const publishConfigString = 'testPublish'
  const resolverResult = 'Some Result'
  const expectedPayload = `{ "${publishConfigString}": "${resolverResult}" }`

  let originalResolver = function () {
    return new Promise((resolve) => {
      t.pass()
      return resolve(resolverResult)
    })
  }

  const pubsub = {
    publish: ({ topic, compiledPayload }, context) => {
      const payload = compiledPayload(context)

      t.deepEqual(topic, publishConfigString)
      t.deepEqual(payload, expectedPayload)
    }
  }

  const resolverMapping = {
    field: 'testResolver',
    publish: publishConfigString
  }

  const wrappedResolver = wrapResolverWithPublish(originalResolver, resolverMapping, pubsub)

  t.truthy(wrappedResolver)
  t.deepEqual(typeof wrappedResolver, 'function')
  return wrappedResolver()
})

test('if publish string is an object, it will be used to configure custom payloads and topics', t => {
  t.plan(5)

  const topicName = 'someTopic'
  const payloadTemplate = `{"myCustomField": {{ toJSON context.result }}, "foo":"bar"}`

  const publishConfigString = JSON.stringify({
    topic: topicName,
    payload: payloadTemplate
  })

  const resolverResult = 'Some Result'
  const expectedPayload = `{"myCustomField": "${resolverResult}", "foo":"bar"}`

  let originalResolver = function () {
    return new Promise((resolve) => {
      t.pass()
      return resolve(resolverResult)
    })
  }

  const pubsub = {
    publish: ({ topic, compiledPayload }, context) => {
      const payload = compiledPayload(context)

      t.deepEqual(topic, topicName)
      t.deepEqual(payload, expectedPayload)
    }
  }

  const resolverMapping = {
    field: 'testResolver',
    publish: publishConfigString
  }

  const wrappedResolver = wrapResolverWithPublish(originalResolver, resolverMapping, pubsub)

  t.truthy(wrappedResolver)
  t.deepEqual(typeof wrappedResolver, 'function')
  return wrappedResolver()
})

test('it should throw if the publish object is missing topic', t => {
  const payloadTemplate = `{"myCustomField": {{ toJSON context.result }}}`

  const publishConfigString = JSON.stringify({
    payload: payloadTemplate
  })

  let originalResolver = function () {
    return new Promise((resolve) => {
      return resolve()
    })
  }

  const pubsub = {
    publish: ({ topic, compiledPayload }, context) => {}
  }

  const resolverMapping = {
    field: 'testResolver',
    publish: publishConfigString
  }

  t.throws(() => {
    wrapResolverWithPublish(originalResolver, resolverMapping, pubsub)
  })
})

test('it should throw if the publish object is missing payload', t => {
  const publishConfigString = JSON.stringify({
    topic: 'someTopic'
  })

  let originalResolver = function () {
    return new Promise((resolve) => {
      return resolve()
    })
  }

  const pubsub = {
    publish: ({ topic, compiledPayload }, context) => {}
  }

  const resolverMapping = {
    field: 'testResolver',
    publish: publishConfigString
  }

  t.throws(() => {
    wrapResolverWithPublish(originalResolver, resolverMapping, pubsub)
  })
})
