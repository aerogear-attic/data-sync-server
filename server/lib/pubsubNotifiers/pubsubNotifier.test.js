const { test } = require('ava')

const pubsubNotifier = require('./pubsubNotifier')

test('It should get InMemory Pubsub Notifier', t => {
  const config = { type: 'InMemory' }

  const pubsub = pubsubNotifier(config)
  t.truthy(pubsub)
})

test('It should get Postgres Pubsub Notifier', t => {
  const config = { type: 'Postgres' }

  const pubsub = pubsubNotifier(config)
  t.truthy(pubsub)
})

test('It should throw an error when an unknown type is supplied', t => {
  const config = { type: 'unknown' }

  t.throws(() => {
    pubsubNotifier(config)
  })
})
