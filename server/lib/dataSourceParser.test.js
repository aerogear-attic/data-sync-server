const {test} = require('ava')

const dataSourceParser = require('./dataSourceParser')

test('should parse single data source successfully', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'user': 'postgres',
        'password': 'mysecretpassword',
        'database': 'postgres',
        'host': '127.0.0.1',
        'dialect': 'postgres'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false)

  t.deepEqual(dataSourceTypes, {'p1': 'postgres'})
  t.is(Object.keys(dataSourceClients).length, 1)
  t.truthy(dataSourceClients['p1'])
})

test('should parse multiple data sources successfully', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'user': 'postgres',
        'password': 'mysecretpassword',
        'database': 'postgres',
        'host': '127.0.0.1',
        'dialect': 'postgres'
      }
    },
    'p2': {
      'type': 'postgres',
      'config': {
        'user': 'postgres2',
        'password': 'mysecretpassword2',
        'database': 'postgres2',
        'host': '127.0.0.12',
        'dialect': 'postgres2'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false)

  t.is(Object.keys(dataSourceTypes).length, 2)
  t.is(Object.keys(dataSourceClients).length, 2)
})

test('should return empty results when no data source is defined', t => {
  const dataSources = {}
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false)

  t.deepEqual(dataSourceTypes, {})
  t.deepEqual(dataSourceClients, {})
})

test('should throw error when there is an unknown data source', t => {
  const dataSources = {
    'p1': {
      'type': 'foo',
      'config': {
        'bar': 'baz'
      }
    }
  }

  t.throws(() => {
    dataSourceParser(dataSources, false)
  })
})
