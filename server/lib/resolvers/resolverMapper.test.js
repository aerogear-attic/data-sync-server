const { test } = require('ava')

const dataSourceParser = require('../datasources/dataSourceParser')
const resolverMapper = require('./resolverMapper')

/*
  NOTE: this is not an integration test. we can only test:
  - if there are resolver functions created for each mapping
  - if base cases are handled well (ignore unknown operations, no unknown
    data sources, no missing requestMapping/responseMapping, ...), no invalid Handlebars templates
 */

test('should create Postgres resolvers successfully with no Handlebars templates', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!

  const resolverMappings = [{
    'type': 'Query',
    'field': 'q1',
    'DataSource': {
      'name': 'p1'
    },
    'requestMapping': 'q1_requestMapping {{ var }}',
    'responseMapping': 'q1_responseMapping {{ toJSON "foo" }}'
  }, {
    'type': 'Mutation',
    'field': 'm1',
    'DataSource': {
      'name': 'p1'
    },
    'requestMapping': 'm1_requestMapping  {{ var }}',
    'responseMapping': 'm1_responseMapping {{ toJSON "foo" }}'
  }]

  const resolvers = resolverMapper(dataSources, resolverMappings)

  t.deepEqual(Object.keys(resolvers), ['Query', 'Mutation'])

  t.deepEqual(Object.keys(resolvers.Query), ['q1'])
  t.deepEqual(Object.keys(resolvers.Mutation), ['m1'])
  t.falsy(resolvers.Subscription)
})

test('should return empty when feeded empty', t => {
  const resolvers = resolverMapper({}, {})

  t.deepEqual(resolvers, {})
})

test('should allow unknown operations', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!

  const resolverMappings = [
    {
      'type': 'Query',
      'field': 'q1',
      'DataSource': {
        'name': 'p1'
      },
      'requestMapping': 'q1_requestMapping',
      'responseMapping': 'q1_responseMapping'
    },
    {
      'type': 'UnknownOperation',
      'field': 'foo',
      'DataSource': {
        'name': 'p1'
      },
      'requestMapping': 'm1_requestMapping  {{ var }}',
      'responseMapping': 'm1_responseMapping {{ toJSON "foo" }}'
    }
  ]
  const resolvers = resolverMapper(dataSources, resolverMappings)

  t.deepEqual(Object.keys(resolvers), ['Query', 'UnknownOperation'])

  t.deepEqual(Object.keys(resolvers.Query), ['q1'])
  t.falsy(resolvers.Mutation)
  t.falsy(resolvers.Subscription)
})

test('should throw exception when data source is not defined', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!
  const resolverMappings = [{
    'type': 'Query',
    'field': 'q1',
    'DataSource': {
      'name': ''
    },
    'requestMapping': 'q1_requestMapping',
    'responseMapping': 'q1_responseMapping'
  }]

  t.throws(() => {
    resolverMapper(dataSources, resolverMappings)
  })
})

test('should throw exception when request mapping is not defined', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!
  const resolverMappings = [{
    'type': 'Query',
    'field': 'q1',
    'DataSource': {
      'name': 'p1'
    },
    'requestMapping': '',
    'responseMapping': 'q1_responseMapping'
  }]

  t.throws(() => {
    resolverMapper(dataSources, resolverMappings)
  })
})

test('should throw exception when response mapping is not defined', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!
  const resolverMappings = [{
    'type': 'Query',
    'field': 'q1',
    'DataSource': {
      'name': 'p1'
    },
    'requestMapping': 'foo',
    'responseMapping': ''
  }]

  t.throws(() => {
    resolverMapper(dataSources, resolverMappings)
  })
})

test('should throw exception when the data source does not exist', t => {
  const resolverMappings = [{
    'type': 'Query',
    'field': 'q1',
    'DataSource': {
      'name': 'p1'
    },
    'requestMapping': 'q1_requestMapping',
    'responseMapping': 'q1_responseMapping'
  }]

  t.throws(() => {
    resolverMapper({}, resolverMappings)
  })
})

test('should throw error when there is an error in request mapping Handlebars templates', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!

  const resolverMappings = [{
    'type': 'Query',
    'field': 'q1',
    'DataSource': {
      'name': 'p1'
    },
    'requestMapping': '{{ var } }',
    'responseMapping': 'q1_responseMapping {{ toJSON "foo" }}'
  }]

  t.throws(() => {
    resolverMapper(dataSources, resolverMappings)
  })
})

test('should throw error when there is an error in response mapping Handlebars templates', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!

  const resolverMappings = [{
    'type': 'Query',
    'field': 'q1',
    'DataSource': {
      'name': 'p1'
    },
    'requestMapping': '{{ var }}',
    'responseMapping': 'q1_responseMapping {{ toJSON "foo" } }'
  }]
  t.throws(() => {
    resolverMapper(dataSources, resolverMappings)
  })
})

test('should create a resolver when resolverMapping.publish is a string', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!

  const resolverMappings = [{
    'type': 'Mutation',
    'field': 'm1',
    'DataSource': {
      'name': 'p1'
    },
    'publish': 'someAction',
    'requestMapping': 'm1_requestMapping  {{ var }}',
    'responseMapping': 'm1_responseMapping {{ toJSON "foo" }}'
  }]

  const resolvers = resolverMapper(dataSources, resolverMappings)

  t.deepEqual(Object.keys(resolvers), ['Mutation'])

  t.deepEqual(Object.keys(resolvers.Mutation), ['m1'])
  t.falsy(resolvers.Subscription)
})

test('should throw when resolverMapping.publish is an empty object', t => {
  const dataSourceDefs = [{
    'type': 'Postgres',
    'name': 'p1',
    'config': {
      'not_really_important': 'not_an_integration_test'
    }
  }]
  const dataSources = dataSourceParser(dataSourceDefs, false) // do not connect!

  const resolverMappings = [{
    'type': 'Mutation',
    'field': 'm1',
    'DataSource': {
      'name': 'p1'
    },
    'publish': '{}',
    'requestMapping': 'm1_requestMapping  {{ var }}',
    'responseMapping': 'm1_responseMapping {{ toJSON "foo" }}'
  }]

  t.throws(() => {
    resolverMapper(dataSources, resolverMappings)
  })
})
