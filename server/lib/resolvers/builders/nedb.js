const JSONParse = require('json-parse-safe')
const { auditLog } = require('../../../lib/util/logger')

function buildNeDBResolver (dataSource, compiledRequestMapping, compiledResponseMapping) {
  return function resolve (obj, args, context, info) {
    return new Promise((resolve, reject) => {
      const dataSourceClient = dataSource.getClient()

      const queryString = compiledRequestMapping({
        context: {
          arguments: args,
          parent: obj
        }
      })

      const parsedQuery = JSONParse(queryString)

      if (parsedQuery.error) {
        // TODO better error message back to user when this happens
        // The goal is that this **should** never happen because
        // The sync UI should validate the JSON before it ever reaches the DB
        auditLog(false, context.request, info, obj, args, parsedQuery.error)
        return reject(parsedQuery.error)
      }

      const {operation, query, doc, options, update} = parsedQuery.value

      switch (operation) {
        case 'findOne':
          dataSourceClient.findOne(query, mapResponse)
          break
        case 'find':
          dataSourceClient.find(query, mapResponse)
          break
        case 'insert':
          dataSourceClient.insert(doc, mapResponse)
          break
        case 'update':
          dataSourceClient.update(query, update, options || {}, mapUpdateResponse)
          break
        case 'remove':
          dataSourceClient.remove(query, options || {}, mapResponse)
          break
        default:
          auditLog(false, context.request, info, obj, args, `Unknown/unsupported nedb operation "${operation}"`)
          return reject(new Error(`Unknown/unsupported nedb operation "${operation}"`))
      }

      function mapResponse (err, res) {
        if (err) return reject(err)

        const responseString = compiledResponseMapping({
          context: {
            result: res
          }
        })

        const {value, error} = JSONParse(responseString)

        if (error) {
          // TODO better error message back to user when this happens
          auditLog(false, context.request, info, obj, args, error.message)
          return reject(error)
        }

        auditLog(true, context.request, info, obj, args, null)
        return resolve(value)
      }

      function mapUpdateResponse (err, numAffected, affectedDocuments) {
        if (numAffected === 0) {
          return mapResponse(err, [])
        }
        return mapResponse(err, affectedDocuments)
      }
    })
  }
}

module.exports = {
  buildResolver: buildNeDBResolver
}
