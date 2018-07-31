const JSONParse = require('json-parse-safe')
const { auditLog } = require('../../../lib/util/logger')

function buildPostgresResolver (dataSource, compiledRequestMapping, compiledResponseMapping) {
  return function resolve (obj, args, context, info) {
    return new Promise((resolve, reject) => {
      const dataSourceClient = dataSource.getClient()

      const queryString = compiledRequestMapping({
        context: {
          arguments: args,
          parent: obj
        }
      })

      dataSourceClient.query(queryString, [], (err, res) => {
        if (err) return reject(err)

        const responseString = compiledResponseMapping({
          context: {
            result: res.rows
          }
        })

        let { value, error } = JSONParse(responseString)

        if (error) {
          // TODO better error message back to user when this happens
          auditLog(false, context.request, info, obj, args, error.message)
          return reject(error)
        }

        auditLog(true, context.request, info, obj, args, null)
        return resolve(value)
      })
    })
  }
}

module.exports = {
  buildResolver: buildPostgresResolver
}
