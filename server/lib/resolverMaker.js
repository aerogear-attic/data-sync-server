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
      if (_.isEmpty(value.dataSource)) {
        throw new Error('Missing data source for mapping: ' + key)
      }

      if (_.isEmpty(value.requestMapping)) {
        throw new Error('Missing request mapping for mapping: ' + key)
      }

      if (_.isEmpty(value.responseMapping)) {
        throw new Error('Missing response mapping for mapping: ' + key)
      }

      if (!(value.dataSource in dataSourceTypes)) {
        throw new Error('Unknown data source "' + value.dataSource + '" for mapping ' + key)
      }

      if (dataSourceTypes[value.dataSource] === 'postgres') {
        const dataSourceClient = dataSourceClients[value.dataSource]
        try {
          resolvers[resolverMappingName][key] = buildPostgresResolver(
            dataSourceClient,
            value.requestMapping,
            value.responseMapping
          )
        } catch (ex) {
          console.log('Error while building Postgres resolver for mapping: ' + key)
          throw new Error('Error while building Postgres resolver for mapping: ' + key)
        }
      }
    })
  })

  return resolvers
}

function buildPostgresResolver (dataSourceClient, requestMapping, responseMapping) {
  // use Handlebars.precompile to fail early during initialization
  try {
    Handlebars.precompile(requestMapping)
  } catch (ex) {
    console.error('Compilation error in requestMapping: ' + requestMapping)
    console.error(ex)
    throw new Error('Compilation error in requestMapping: ' + requestMapping)
  }

  try {
    Handlebars.precompile(responseMapping)
  } catch (ex) {
    console.error('Compilation error in response mapping: ' + responseMapping)
    console.error(ex)
    throw new Error('Compilation error in response mapping: ' + responseMapping)
  }

  const compiledRequestMapping = Handlebars.compile(requestMapping)
  const compiledResponseMapping = Handlebars.compile(responseMapping)

  return (obj, args, context, info) => {
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
