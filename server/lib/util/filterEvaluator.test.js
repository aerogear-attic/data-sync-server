const { test } = require('ava')
const { evalWithContext } = require('./filterEvaluator')()

test('throws if a non object is passed', t => {
  const exp1 = []
  const exp2 = 2
  const exp3 = 'some string'
  const exp4 = null
  const exp5 = undefined

  t.throws(evalWithContext.bind(null, exp1))
  t.throws(evalWithContext.bind(null, exp2))
  t.throws(evalWithContext.bind(null, exp3))
  t.throws(evalWithContext.bind(null, exp4))
  t.throws(evalWithContext.bind(null, exp5))
})

test('throws if an expression has multiple keys', t => {
  const exp1 = { eq: [1, 1], or: [1, 2] }
  t.throws(evalWithContext.bind(null, exp1))
})

test('throws if an operation has less or more than two arguments', t => {
  const exp1 = { eq: [1, 1, 1] }
  const exp2 = { eq: [1] }
  const exp3 = { eq: [1, 1] }

  t.throws(evalWithContext.bind(null, exp1))
  t.throws(evalWithContext.bind(null, exp2))
  t.notThrows(evalWithContext.bind(null, exp3))
})

test('throws if an unknown operator is used', t => {
  const exp1 = { unknown: ['foo', 'bar'] }

  t.throws(evalWithContext.bind(null, exp1))
})

test('throws if an operation has more than two arguments', t => {
  const exp1 = { eq: [1, 1, 1] }
  t.throws(evalWithContext.bind(null, exp1))
})

test('it does not try to resolve the string "$" from context', t => {
  const context = {
    some: {
      nested: {
        field: 'foo'
      }
    }
  }
  const exp1 = { eq: ['$', '$'] }
  const exp2 = { eq: ['$', '$some.nested.field'] }

  t.truthy(evalWithContext(exp1, context))
  t.falsy(evalWithContext(exp2, context))
})

test('Simplified equals syntax should work with no context field', t => {
  const exp1 = {'foo': 'foo'}
  const exp2 = {1: 1}

  t.truthy(evalWithContext(exp1))
  t.truthy(evalWithContext(exp2))

  const exp3 = {'foo': 'bar'}
  const exp4 = {1: 2}

  t.falsy(evalWithContext(exp3))
  t.falsy(evalWithContext(exp4))
})

test('eq syntax should work with no context field', t => {
  const exp1 = {'eq': ['foo', 'foo']}
  const exp2 = {'eq': [1, 1]}

  t.truthy(evalWithContext(exp1))
  t.truthy(evalWithContext(exp2))

  const exp3 = {'eq': ['foo', 'bar']}
  const exp4 = {'eq': [1, 2]}

  t.falsy(evalWithContext(exp3))
  t.falsy(evalWithContext(exp4))
})

test('Simplified equals syntax should work with context field', t => {
  const context = {
    some: {
      nested: {
        field: 'bar'
      },
      other: {
        field: 'bar'
      }
    }
  }

  const exp1 = {'$some.nested.field': 'bar'}
  const exp2 = {'$some.nested.field': '$some.other.field'}

  t.truthy(evalWithContext(exp1, context))
  t.truthy(evalWithContext(exp2, context))

  const exp3 = {'$some.undefined.field': 'bar'}
  const exp4 = {'bar': '$some.undefined.field'}

  t.falsy(evalWithContext(exp3))
  t.falsy(evalWithContext(exp4))
})

test('eq syntax should work with context field', t => {
  const context = {
    some: {
      nested: {
        field: 'bar'
      },
      other: {
        field: 'bar'
      }
    }
  }

  const exp1 = { eq: ['$some.nested.field', 'bar'] }
  const exp2 = { eq: ['$some.nested.field', '$some.other.field'] }

  t.truthy(evalWithContext(exp1, context))
  t.truthy(evalWithContext(exp2, context))
})

test('basic usage of and syntax works', t => {
  const exp1 = {
    and: [
      {eq: ['equal', 'equal']},
      {eq: [1, 1]}
    ]
  }

  t.truthy(evalWithContext(exp1))

  const exp2 = {
    and: [
      {'equal': 'equal'},
      {'not': 'equal'}
    ]
  }

  t.falsy(evalWithContext(exp2))
})

test('basic usage of or syntax works', t => {
  const exp1 = {
    or: [
      {eq: ['equal', 'equal']},
      {eq: ['not', 'equal']}
    ]
  }

  // using simplified equals syntax nested inside another expression
  const exp2 = {
    or: [
      {'equal': 'equal'},
      {'not': 'equal'}
    ]
  }

  t.truthy(evalWithContext(exp1))
  t.truthy(evalWithContext(exp2))

  const exp3 = {
    or: [
      {eq: ['not', 'equal']},
      {eq: ['not', 'equal']}
    ]
  }

  const exp4 = {
    or: [
      {'not': 'equal'},
      {'not': 'equal'}
    ]
  }

  t.falsy(evalWithContext(exp3))
  t.falsy(evalWithContext(exp4))
})

test('advanced nested syntax works', t => {
  const exp1 = {
    and: [
      {eq: [1, 1]},
      {
        or: [
          {eq: [1, 2]},
          {eq: ['not', 'equal']},
          {
            and: [
              {eq: ['true', 'true']},
              {eq: [1, 1]}
            ]
          }
        ]
      }
    ]
  }

  t.truthy(evalWithContext(exp1))
})

//
//
//
//
//
//
//
//

test('and syntax works with context', t => {
  const context = {
    some: {
      nested: {
        field: 'bar'
      },
      other: {
        field: 1
      }
    }
  }

  const exp1 = {
    and: [
      {eq: ['$some.nested.field', 'bar']},
      {eq: [1, '$some.other.field']}
    ]
  }

  t.truthy(evalWithContext(exp1, context))

  const exp2 = {
    and: [
      {'$some.nested.field': 'bar'},
      {2: '$some.nested.field'}
    ]
  }

  t.falsy(evalWithContext(exp2, context))
})

test('or syntax works with context', t => {
  const context = {
    some: {
      nested: {
        field: 'bar'
      },
      other: {
        field: 1
      }
    }
  }

  const exp1 = {
    or: [
      {eq: ['$some.nested.field', 'bar']},
      {eq: ['foo', '$some.nested.field']}
    ]
  }

  // using simplified equals syntax nested inside another expression
  const exp2 = {
    or: [
      {'$some.nested.field': 'bar'},
      {'not': '$some.nested.field'}
    ]
  }

  t.truthy(evalWithContext(exp1, context))
  t.truthy(evalWithContext(exp2, context))

  const exp3 = {
    or: [
      {eq: ['$some.nested.field', 'equal']},
      {eq: ['not', '$some.nested.field']}
    ]
  }

  const exp4 = {
    or: [
      {'not': '$some.nested.field'},
      {'$some.nested.field': 'equal'}
    ]
  }

  t.falsy(evalWithContext(exp3, context))
  t.falsy(evalWithContext(exp4, context))
})

test('advanced nested syntax works with context', t => {
  const context = {
    some: {
      nested: {
        field: 'bar'
      },
      other: {
        field: 1
      }
    }
  }

  const exp1 = {
    and: [
      {eq: [1, 1]},
      {
        or: [
          {eq: [1, 2]},
          {eq: ['not', 'equal']},
          {
            and: [
              {eq: ['$some.nested.field', 'bar']},
              {eq: ['$some.other.field', 1]}
            ]
          }
        ]
      }
    ]
  }

  t.truthy(evalWithContext(exp1, context))
})
