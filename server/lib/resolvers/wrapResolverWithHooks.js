const _ = require('lodash')
const {log} = require('../util/logger')
const request = require('request')

exports.wrapResolverWithHooks = function wrapResolverWithHooks (resolverFn, resolverMapping) {
  return (obj, args, context, info) => {
    return new Promise(async (resolve, reject) => {
      if (resolverMapping.preHook && !_.isEmpty(resolverMapping.preHook)) {
        log.info(resolverMapping.preHook)
        request.get(resolverMapping.preHook).on('error', function (err) {
          log.err(err)
        })
      }

      try {
        const result = await resolverFn(obj, args, context, info)
        resolve(result)
      } catch (error) {
        log.error(error)
        reject(error)
      }
    }).then(function (result) {
      if (resolverMapping.postHook && !_.isEmpty(resolverMapping.postHook)) {
        log.info(resolverMapping.postHook)
        request.get(resolverMapping.preHook).on('error', function (err) {
          log.err(err)
        })
      }
      return result
    })
  }
}
