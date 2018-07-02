const _ = require('lodash')
const Handlebars = require('handlebars')
Handlebars.registerHelper('toJSON', function (json) {
  return new Handlebars.SafeString(JSON.stringify(json))
})

module.exports = function (dataSources, resolverMappings) {
  const resolvers = {
    Query: {},
    Mutation: {},
    Subscription: {}
  }

  _.forEach(resolverMappings, (resolverMapping, resolverMappingName) => {
    if (_.isEmpty(resolverMapping.type)) {
      throw new Error('Missing query type for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.dataSource)) {
      throw new Error('Missing data source for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.requestMapping)) {
      throw new Error('Missing request mapping for mapping: ' + resolverMappingName)
    }

    if (_.isEmpty(resolverMapping.responseMapping)) {
      throw new Error('Missing response mapping for mapping: ' + resolverMappingName)
    }

    if (!(resolverMapping.dataSource in dataSources)) {
      throw new Error('Unknown data source "' + resolverMapping.dataSource + '" for mapping ' + resolverMappingName)
    }

    let { type, client } = dataSources[resolverMapping.dataSource]

    if (type === 'postgres') {
      try {
        resolvers[resolverMapping.type][resolverMappingName] = buildPostgresResolver(
          client,
          resolverMapping.requestMapping,
          resolverMapping.responseMapping
        )
      } catch (ex) {
        console.log('Error while building Postgres resolver for mapping: ' + resolverMappingName)
        throw new Error('Error while building Postgres resolver for mapping: ' + resolverMappingName)
      }
    }
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
