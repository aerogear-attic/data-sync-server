const { test } = require('ava')

const dataSourceParser = require('./dataSourceParser')

test('should parse single data source successfully', t => {
  const dataSourceDefs = {
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
  const dataSources = dataSourceParser(dataSourceDefs, false)

  t.is(Object.keys(dataSources).length, 1)
  t.truthy(dataSources['p1'])

  let { type, client } = dataSources['p1']
  t.deepEqual(type, 'postgres')
  t.truthy(client)
})

test('should parse multiple data sources successfully', t => {
  const dataSourceDefs = {
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
  const dataSources = dataSourceParser(dataSourceDefs, false)

  t.is(Object.keys(dataSources).length, 2)
})

test('should return empty results when no data source is defined', t => {
  const dataSourceDefs = {}
  const dataSources = dataSourceParser(dataSourceDefs, false)

  t.deepEqual(dataSources, {})
})

test('should throw error when there is an unknown data source', t => {
  const dataSourceDefs = {
    'p1': {
      'type': 'foo',
      'config': {
        'bar': 'baz'
      }
    }
  }

  t.throws(() => {
    dataSourceParser(dataSourceDefs, false)
  })
})
