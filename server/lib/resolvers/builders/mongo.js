const { VM } = require('vm2')
const { auditLog, log } = require('../../../lib/util/logger')
const { updateResolverMetrics } = require('../../../metrics')

function buildMongoResolver (dataSource, compiledRequestMapping, compiledResponseMapping) {
  const vm = new VM({
    sandbox: {
      db: dataSource.getClient()
    }
  })

  // run the vm code which will return a function that executes the user code
  // although the userCode is not actually being run inside the vm,
  // it is bound to the context inside the vm so it cannot do things like require()
  const userResolverFunction = vm.run(compiledRequestMapping)

  return function resolve (obj, args, context, info) {
    return new Promise((resolve, reject) => {
      const requestTimeStart = Date.now()
      info['dataSourceType'] = dataSource.type

      const resolveArgs = {
        parent: obj,
        args,
        info,
        context
      }

      const query = userResolverFunction(resolveArgs)

      // Promise.resolve ensures that if the user code doesn't return a promise
      // we can still interact with it like a promise
      Promise.resolve(query).then((result) => {
        auditLog(true, context.request, info, obj, args, null)
        return resolve(result)
      }).catch((error) => {
        log.error({ msg: 'error executing user resolver', error })
        auditLog(false, context.request, info, obj, args, error.message)
        return reject(error)
      }).finally(() => {
        updateResolverMetrics(info, Date.now() - requestTimeStart)
      })
    })
  }
}

module.exports = {
  buildResolver: buildMongoResolver
}
