const _ = require('lodash')

module.exports = function ExpressionParser () {
  const basicOperators = {
    'eq': _.eq,
    'gt': _.gt,
    'gte': _.gte,
    'lt': _.lt,
    'lte': _.lte,
    '!eq': (arg, other) => { return !_.eq(arg, other) },
    '!gt': (arg, other) => { return !_.gt(arg, other) },
    '!gte': (arg, other) => { return !_.gte(arg, other) },
    '!lt': (arg, other) => { return !_.lt(arg, other) },
    '!lte': (arg, other) => { return !_.lte(arg, other) },
    'match': (str, regex) => {
      if (typeof str === 'string' && typeof regex === 'string') {
        return new RegExp(regex).test(str)
      }
      return false
    }
  }

  const loopOperators = {
    and: _.every,
    or: _.some
  }

  function evalWithContext (expression, context) {
    function evalExpression (expression, index) {
      if (typeof expression !== 'object') {
        throw Error('expression is not an object', expression)
      }

      const keys = Object.keys(expression)
      if (keys.length !== 1) {
        throw Error('expression should only have one key', JSON.stringify(expression))
      }

      let operator = keys[0]
      let args = expression[operator]

      let argsType = typeof args

      if (argsType === 'string' || argsType === 'number' || argsType === 'boolean' || argsType === 'undefined') {
        return evalString(operator, context) === evalString(args, context)
      }

      if (basicOperators[operator]) {
        return evaluateBasicExpression(operator, args, context)
      } else if (loopOperators[operator]) {
        return loopOperators[operator](args, evalExpression)
      } else {
        throw Error('unkown operator ' + operator + ' in expression ' + JSON.stringify(expression))
      }
    }
    return evalExpression(expression)
  }

  function evaluateBasicExpression (operator, args, context) {
    if (!Array.isArray(args)) {
      throw Error('args must be an array. operator: ' + operator + ' args: ' + args)
    }
    if (args.length !== 2) {
      throw Error('args array must have two elements. operator: ' + operator + ' args: ' + args)
    }
    const expressionFn = basicOperators[operator]
    if (typeof expressionFn !== 'function') {
      throw Error('undefined operator ' + operator)
    }
    const arg1 = evalString(args[0], context)
    const arg2 = evalString(args[1], context)
    return expressionFn(arg1, arg2)
  }

  function evalString (str, context) {
    if (typeof str !== 'string' || str.length <= 1) {
      return str
    }
    const c1 = str[0]
    if (c1 === '$') {
      const cn = str.substring(1)
      return _.get(context, cn)
    } else {
      return str
    }
  }

  return {
    evalWithContext
  }
}
