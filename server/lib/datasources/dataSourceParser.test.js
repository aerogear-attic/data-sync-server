const {test} = require('ava')

const dataSourceParser = require('./dataSourceParser')

test('should parse single data source successfully', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'user': 'postgres',
      'password': 'mysecretpassword',
      'database': 'postgres',
      'host': '127.0.0.1',
      'dialect': 'postgres'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false)

  t.is(Object.keys(dataSources).length, 1)
  t.truthy(dataSources['p1'])

  const type = dataSources['p1'].type
  t.deepEqual(type, 'Postgres')
})

test('should parse multiple data sources successfully', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'user': 'postgres',
      'password': 'mysecretpassword',
      'database': 'postgres',
      'host': '127.0.0.1',
      'dialect': 'postgres'
    }
  }, {
    'type': 'Postgres',
    'name': 'p2',
    'config': {
      'user': 'postgres2',
      'password': 'mysecretpassword2',
      'database': 'postgres2',
      'host': '127.0.0.12',
      'dialect': 'postgres2'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false)

  t.is(Object.keys(dataSources).length, 2)
})

test('should return empty results when no data source is defined', t => {
  const dataSourceDefs = {}
  const dataSources = dataSourceParser(dataSourceDefs, false)

  t.deepEqual(dataSources, {})
})

test('should throw error when there is an unknown data source', t => {
  const dataSourceDefs = [{
    'type': 'foo',
    'name': 'p1',
    'config': {
      'bar': 'baz'
    }
  }]

  t.throws(() => {
    dataSourceParser(dataSourceDefs, false)
  })
})
