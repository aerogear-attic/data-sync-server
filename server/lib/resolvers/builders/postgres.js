const JSONParse = require('json-parse-safe')

function buildPostgresResolver (dataSourceClient, compiledRequestMapping, compiledResponseMapping) {
  return function resolve (obj, args, context, info) {
    return new Promise((resolve, reject) => {
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
          return reject(error)
        }

        return resolve(value)
      })
    })
  }
}

module.exports = {
  buildResolver: buildPostgresResolver
}
