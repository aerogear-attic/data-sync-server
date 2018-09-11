const { VM } = require('vm2')
const { auditLog, log } = require('../../../lib/util/logger')
const { updateResolverMetrics } = require('../../../metrics')
const { isEmpty } = require('lodash')

function buildKnexResolver (dataSource, compiledRequestMapping, compiledResponseMapping) {
  return function resolve (obj, args, context, info) {
    return new Promise((resolve, reject) => {
      const dataSourceClient = dataSource.getClient()
      const requestTimeStart = Date.now()
      info['dataSourceType'] = dataSource.type

      const sandbox = {
        db: dataSourceClient,
        arguments: args,
        parent: obj
      }

      const vm = new VM({
        sandbox
      })

      // result is whatever is implicitly returned from the script
      // in this case it will be the query builder object from knex
      const query = vm.run(compiledRequestMapping)

      // this is a super rough implementation
      query.then((result) => {
        log.info({ msg: 'result from knex', result })

        if (isEmpty(compiledResponseMapping)) {
          auditLog(true, context.request, info, obj, args, null)
          return resolve(result)
        }

        const responseSandbox = {
          result: result
        }

        const responsevm = new VM({
          sandbox: responseSandbox
        })

        auditLog(true, context.request, info, obj, args, null)

        return resolve(responsevm.run(compiledResponseMapping))
      }).catch((error) => {
        log.error({ msg: 'error from knex', error })
        auditLog(false, context.request, info, obj, args, error.message)
        return reject(error)
      }).finally(() => {
        updateResolverMetrics(info, Date.now() - requestTimeStart)
      })
    })
  }
}

module.exports = {
  buildResolver: buildKnexResolver
}
