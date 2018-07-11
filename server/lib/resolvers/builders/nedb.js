const JSONParse = require('json-parse-safe')

function buildNeDBResolver (dataSourceClient, compiledRequestMapping, compiledResponseMapping) {
  return function resolve (obj, args, context, info) {
    return new Promise((resolve, reject) => {
      const queryString = compiledRequestMapping({
        context: {
          arguments: args
        }
      })

      const parsedQuery = JSONParse(queryString)

      if (parsedQuery.error) {
        // TODO better error message back to user when this happens
        // The goal is that this **should** never happen because
        // The sync UI should validate the JSON before it ever reaches the DB
        return reject(parsedQuery.error)
      }

      const { operation, query, doc, options, update } = parsedQuery.value

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
          dataSourceClient.update(query, update, options || {}, mapResponse)
          break
        case 'remove':
          dataSourceClient.remove(query, options || {}, mapResponse)
          break
        default:
          return reject(new Error(`Unknown/unsupported nedb operation "${operation}"`))
      }

      function mapResponse (err, res) {
        if (err) return reject(err)

        const responseString = compiledResponseMapping({
          context: {
            result: res
          }
        })

        const { value, error } = JSONParse(responseString)

        if (error) {
          // TODO better error message back to user when this happens
          return reject(error)
        }

        return resolve(value)
      }
    })
  }
}

module.exports = {
  buildResolver: buildNeDBResolver
}
