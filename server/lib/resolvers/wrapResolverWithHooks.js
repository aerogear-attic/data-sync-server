const _ = require('lodash')
const { log, buildPath } = require('../util/logger')

exports.wrapResolverWithHooks = function wrapResolverWithHooks (resolverFn, resolverMapping, httpClient) {
  return (obj, args, context, info) => {
    return new Promise(async (resolve, reject) => {
      if (resolverMapping.preHook && !_.isEmpty(resolverMapping.preHook)) {
        const payload = {
          hookType: 'preHook',
          operationType: info.operation.operation,
          fieldName: info.fieldname,
          parentTypeName: info.parentType.name,
          path: buildPath(info.path),
          args: args
        }
        httpClient.post(resolverMapping.preHook, payload)
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
        const payload = {
          hookType: 'postHook',
          operationType: info.operation.operation,
          fieldName: info.fieldname,
          parentTypeName: info.parentType.name,
          path: buildPath(info.path),
          result: result
        }
        httpClient.post(resolverMapping.postHook, payload)
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
