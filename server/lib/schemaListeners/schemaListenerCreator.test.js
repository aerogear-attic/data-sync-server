const {test} = require('ava')

const schemaListenerCreator = require('./schemaListenerCreator')

test('should get schemaListener successfully - no errors thrown', t => {
  const schemaListenerConfig = {
    type: 'postgres',
    config: {
      channel: 'aerogear-data-sync-config',
      database: 'aerogear_data_sync_db',
      user: 'postgres',
      password: 'postgres',
      host: '127.0.0.1',
      port: 5432
    }
  }

  const listener = schemaListenerCreator(schemaListenerConfig)
  t.truthy(listener)
})

test('should throw an error when the schema listener type is unknown', t => {
  const schemaListenerConfig = {
    type: 'unknown'
  }
  t.throws(() => {
    schemaListenerCreator(schemaListenerConfig)
  })
})
