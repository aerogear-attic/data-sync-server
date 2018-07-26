const { test } = require('ava')
const subscriptionMapper = require('./subscriptionMapper')

test('It should create subscripton resolvers successfully', t => {
  const pubsub = {}
  const subscriptionMappings = [
    {
      'type': 'Subscription',
      'field': 's1',
      'topic': 'someTopic'
    },
    {
      'type': 'Subscription',
      'field': 's2',
      'topic': 'someTopic'
    }
  ]

  const subscriptionResolvers = subscriptionMapper(subscriptionMappings, pubsub)

  t.deepEqual(Object.keys(subscriptionResolvers), ['Subscription'])
  t.deepEqual(Object.keys(subscriptionResolvers.Subscription), ['s1', 's2'])
})

test('It should create subscripton resolvers successfully even if a topic is not defined', t => {
  const pubsub = {}
  const subscriptionMappings = [
    {
      'type': 'Subscription',
      'field': 's1'
    },
    {
      'type': 'Subscription',
      'field': 's2'
    }
  ]

  const subscriptionResolvers = subscriptionMapper(subscriptionMappings, pubsub)

  t.deepEqual(Object.keys(subscriptionResolvers), ['Subscription'])
  t.deepEqual(Object.keys(subscriptionResolvers.Subscription), ['s1', 's2'])
})

test('It should create resolvers when a filter option is applied', t => {
  const pubsub = {}
  const subscriptionMappings = [
    {
      'type': 'Subscription',
      'field': 's1',
      'filter': {
        'foo': 'bar'
      }
    },
    {
      'type': 'Subscription',
      'field': 's2',
      'filter': {
        'foo': 'bar'
      }
    }
  ]

  const subscriptionResolvers = subscriptionMapper(subscriptionMappings, pubsub)

  t.deepEqual(Object.keys(subscriptionResolvers), ['Subscription'])
  t.deepEqual(Object.keys(subscriptionResolvers.Subscription), ['s1', 's2'])
})

test('It should throw if type is not Subscription', t => {
  const pubsub = {}
  const subscriptionMappings = [
    {
      'type': 'Not a Subscription',
      'field': 's1'
    },
    {
      'type': 'Subscription',
      'field': 's2'
    }
  ]
  t.throws(() => {
    subscriptionMapper(subscriptionMappings, pubsub)
  })
})
