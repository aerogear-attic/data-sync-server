function buildPostgresResolver (dataSourceClient, compiledRequestMapping, compiledResponseMapping) {
  return function resolve (obj, args, context, info) {
    return new Promise((resolve, reject) => {
      const queryString = compiledRequestMapping({
        context: {
          arguments: args
        }
      })
      dataSourceClient.query(queryString, [], (err, res) => {
        if (err) return reject(err)
        // TODO: should we end the connection with each request?
        // dataSourceClient.end()

        const responseString = compiledResponseMapping({
          context: {
            result: res.rows
          }
        })

        let response
        try {
          response = JSON.parse(responseString)
        } catch (e) {
          // TODO better error message back to user when this happens
          return reject(e)
        }

        return resolve(response)
      })
    })
  }
}

module.exports = {
  buildResolver: buildPostgresResolver
}
