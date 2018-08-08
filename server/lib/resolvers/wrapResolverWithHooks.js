const _ = require('lodash')
const {log} = require('../util/logger')

exports.wrapResolverWithHooks = function wrapResolverWithHooks (resolverFn, resolverMapping, requestObject) {
  return (obj, args, context, info) => {
    return new Promise(async (resolve, reject) => {
      if (resolverMapping.preHook && !_.isEmpty(resolverMapping.preHook)) {
        requestObject.post(resolverMapping.preHook, {args})
          .then(function (response) {
            log.info(response)
          })
          .catch(function (error) {
            log.err(error)
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
        requestObject.post(resolverMapping.postHook, {result})
          .then(function (response) {
            log.info(response)
          })
          .catch(function (error) {
            log.err(error)
          })
      }
      return result
    })
  }
}
