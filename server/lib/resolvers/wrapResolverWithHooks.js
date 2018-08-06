const _ = require('lodash')
const {log} = require('../util/logger')
const axios = require('axios')

exports.wrapResolverWithHooks = function wrapResolverWithHooks (resolverFn, resolverMapping) {
  return (obj, args, context, info) => {
    return new Promise(async (resolve, reject) => {
      if (resolverMapping.preHook && !_.isEmpty(resolverMapping.preHook)) {
        axios.get(resolverMapping.preHook)
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
        axios.get(resolverMapping.postHook)
          .catch(function (error) {
            log.err(error)
          })
      }
      return result
    })
  }
}
