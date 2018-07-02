const {test} = require('ava')

const dataSourceParser = require('./dataSourceParser')
const resolverMaker = require('./resolverMaker')

/*
  NOTE: this is not an integration test. we can only test:
  - if there are resolver functions created for each mapping
  - if base cases are handled well (ignore unknown operations, no unknown
    data sources, no missing requestMapping/responseMapping, ...), no invalid Handlebars templates
 */

test('should create Postgres resolvers successfully with no Handlebars templates', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'not_really_important': 'not_an_integration_test'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false) // do not connect!

  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': 'p1',
        'requestMapping': 'q1_requestMapping {{ var }}',
        'responseMapping': 'q1_responseMapping {{ toJSON "foo" }}'
      }
    },
    'Mutation': {
      'm1': {
        'dataSource': 'p1',
        'requestMapping': 'm1_requestMapping  {{ var }}',
        'responseMapping': 'm1_responseMapping {{ toJSON "foo" }}'
      }
    }
  }
  const resolvers = resolverMaker(dataSourceTypes, dataSourceClients, resolverMappings)

  t.deepEqual(Object.keys(resolvers), ['Query', 'Mutation', 'Subscription'])

  t.deepEqual(Object.keys(resolvers.Query), ['q1'])
  t.deepEqual(Object.keys(resolvers.Mutation), ['m1'])
  t.deepEqual(Object.keys(resolvers.Subscription), [])
})

test('should return empty when feeded empty', t => {
  const resolvers = resolverMaker({}, {}, {})

  t.deepEqual(resolvers, {
    Query: {},
    Mutation: {},
    Subscription: {}
  })
})

test('should ignore unknown operations', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'not_really_important': 'not_an_integration_test'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false) // do not connect!

  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': 'p1',
        'requestMapping': 'q1_requestMapping',
        'responseMapping': 'q1_responseMapping'
      }
    },
    'UnknownOperation': {
      'foo': {
        'dataSource': 'p1',
        'requestMapping': 'm1_requestMapping  {{ var }}',
        'responseMapping': 'm1_responseMapping {{ toJSON "foo" }}'
      }
    }
  }
  const resolvers = resolverMaker(dataSourceTypes, dataSourceClients, resolverMappings)

  t.deepEqual(Object.keys(resolvers), ['Query', 'Mutation', 'Subscription'])

  t.deepEqual(Object.keys(resolvers.Query), ['q1'])
  t.deepEqual(Object.keys(resolvers.Mutation), [])
  t.deepEqual(Object.keys(resolvers.Subscription), [])
})

test('should throw exception when data source is not defined', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'not_really_important': 'not_an_integration_test'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false) // do not connect!
  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': '',
        'requestMapping': 'q1_requestMapping',
        'responseMapping': 'q1_responseMapping'
      }
    }
  }

  t.throws(() => {
    resolverMaker(dataSourceTypes, dataSourceClients, resolverMappings)
  })
})

test('should throw exception when request mapping is not defined', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'not_really_important': 'not_an_integration_test'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false) // do not connect!
  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': 'p1',
        'requestMapping': '',
        'responseMapping': 'q1_responseMapping'
      }
    }
  }

  t.throws(() => {
    resolverMaker(dataSourceTypes, dataSourceClients, resolverMappings)
  })
})

test('should throw exception when response mapping is not defined', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'not_really_important': 'not_an_integration_test'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false) // do not connect!
  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': 'p1',
        'requestMapping': 'foo',
        'responseMapping': ''
      }
    }
  }

  t.throws(() => {
    resolverMaker(dataSourceTypes, dataSourceClients, resolverMappings)
  })
})

test('should throw exception when the data source does not exist', t => {
  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': 'p1',
        'requestMapping': 'q1_requestMapping',
        'responseMapping': 'q1_responseMapping'
      }
    }
  }

  t.throws(() => {
    resolverMaker({}, {}, resolverMappings)
  })
})

test('should throw error when there is an error in request mapping Handlebars templates', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'not_really_important': 'not_an_integration_test'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false) // do not connect!

  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': 'p1',
        'requestMapping': '{{ var } }',
        'responseMapping': 'q1_responseMapping {{ toJSON "foo" }}'
      }
    }
  }

  t.throws(() => {
    resolverMaker(dataSourceTypes, dataSourceClients, resolverMappings)
  })
})

test('should throw error when there is an error in response mapping Handlebars templates', t => {
  const dataSources = {
    'p1': {
      'type': 'postgres',
      'config': {
        'not_really_important': 'not_an_integration_test'
      }
    }
  }
  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSources, false) // do not connect!

  const resolverMappings = {
    'Query': {
      'q1': {
        'dataSource': 'p1',
        'requestMapping': '{{ var }}',
        'responseMapping': 'q1_responseMapping {{ toJSON "foo" } }'
      }
    }
  }
  t.throws(() => {
    resolverMaker(dataSourceTypes, dataSourceClients, resolverMappings)
  })
})
