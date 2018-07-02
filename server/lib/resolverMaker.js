const _ = require('lodash')
const Handlebars = require('handlebars')
Handlebars.registerHelper('toJSON', function (json) {
  return new Handlebars.SafeString(JSON.stringify(json))
})

module.exports = function (dataSourceTypes, dataSourceClients, resolverMappingsJson) {
  const resolvers = {
    Query: {},
    Mutation: {},
    Subscription: {}
  }

  _.forEach(resolverMappingsJson, (resolverMapping, resolverMappingName) => {
    // only setup mappings for queries and mutations at this time
    if (['Query', 'Mutation'].indexOf(resolverMappingName) < 0) {
      return
    }

    _.forEach(resolverMapping, (value, key) => {
      if (dataSourceTypes[value.dataSource] === 'postgres') {
        const dataSourceClient = dataSourceClients[value.dataSource]
        resolvers[resolverMappingName][key] = buildPostgresResolver(
          dataSourceClient,
          value.requestMapping,
          value.responseMapping
        )
      }
    })
  })

  return resolvers
}

function buildPostgresResolver (dataSourceClient, requestMapping, responseMapping) {
  return (obj, args, context, info) => {
    return new Promise((resolve, reject) => {
      const queryString = Handlebars.compile(requestMapping)({
        context: {
          arguments: args
        }
      })
      dataSourceClient.query(queryString, [], (err, res) => {
        if (err) return reject(err)
        // TODO: should we end the connection with each request?
        // dataSourceClient.end()

        const responseString = Handlebars.compile(responseMapping)({
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
