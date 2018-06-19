const fs = require('fs')
const graphqlTools = require('graphql-tools')
// const graphqlSubscriptions = require('graphql-subscriptions')
const _ = require('lodash')
const { Client } = require('pg')
const Handlebars = require('handlebars')
Handlebars.registerHelper('toJSON', function (json) {
  return new Handlebars.SafeString(JSON.stringify(json))
})
const Datastore = require('nedb')
const http = require('http')

let dataSourceClients = {}

function makeResolvers (dataSources, resolverMappings) {
  // connect to any datasources with persistent connections
  _.forEach(dataSources, (value, key) => {
    console.log('dataSources', value, key)
    console.log('dataSources value', value)
    if (value.type === 'postgres') {
      dataSourceClients[key] = new Client(value.config)
      dataSourceClients[key].connect()
    } else if (value.type === 'nedb') {
      dataSourceClients[key] = new Datastore()
    }
  })

  var resolvers = {
    Query: {},
    Mutation: {},
    Subscription: {}
  }

  _.forEach(resolverMappings, (resolverMapping, resolverMappingName) => {
    // only setup mappings for queries and mutations at this time
    console.log('resolverMappingName', resolverMappingName)
    if (['Query', 'Mutation'].indexOf(resolverMappingName) < 0) {
      return
    }

    _.forEach(resolverMapping, (value, key) => {
      console.log('value', value)
      var dataSourceClient
      var dataSource = dataSources[value.dataSource]
      if (dataSource.type === 'postgres') {
        dataSourceClient = dataSourceClients[value.dataSource]
        resolvers[resolverMappingName][key] = (obj, args, context, info) => {
          console.log('resolver impl args:', obj, args, context, info)
          return new Promise((resolve, reject) => {
            console.log('value.requestMapping', value.requestMapping)
            var queryString = Handlebars.compile(value.requestMapping)({
              context: {
                arguments: args
              }
            })
            console.log('queryString', queryString)
            dataSourceClient.query(queryString, [], (err, res) => {
              console.log('err/rows', err ? err.stack : res.rows) // Hello World!
              if (err) return reject(err)
              // TODO: should we end the connection with each request?
              // dataSourceClient.end()

              console.log('value.responseMapping', value.responseMapping)
              var responseString = Handlebars.compile(value.responseMapping)({
                context: {
                  result: res.rows
                }
              })
              console.log('responseString', responseString)
              var response
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
      } else if (dataSource.type === 'nedb') {
        dataSourceClient = dataSourceClients[value.dataSource]
        resolvers[resolverMappingName][key] = (obj, args, context, info) => {
          console.log('resolver impl args:', obj, args, context, info)
          return new Promise((resolve, reject) => {
            var requestMapping = Handlebars.compile(value.requestMapping)({
              context: {
                arguments: args
              }
            })
            console.log('requestMapping', requestMapping)

            var request
            try {
              request = JSON.parse(requestMapping)
            } catch (e) {
            // TODO better error message back to user when this happens
              return reject(e)
            }

            function mapResponse (err, res) {
              if (err) return reject(err)

              console.log('value.responseMapping', value.responseMapping)
              var responseString = Handlebars.compile(value.responseMapping)({
                context: {
                  result: res
                }
              })
              console.log('responseString', responseString)
              var response
              try {
                response = JSON.parse(responseString)
              } catch (e) {
              // TODO better error message back to user when this happens
                return reject(e)
              }

              return resolve(response)
            }

            switch (request.operation) {
              case 'findOne':
                dataSourceClient.findOne(request.query, mapResponse)
                break
              case 'find':
                dataSourceClient.find(request.query, mapResponse)
                break
              case 'insert':
                dataSourceClient.insert(request.doc, mapResponse)
                break
              case 'update':
                dataSourceClient.update(request.query, request.update, request.options, mapResponse)
                break
              case 'remove':
                dataSourceClient.remove(request.query, request.options, mapResponse)
                break
              default:
                return reject(new Error(`Unknown/unsupported nedb operation "${request.operation}"`))
            }
          })
        }
      } else if (dataSource.type === 'http') {
        resolvers[resolverMappingName][key] = (obj, args, context, info) => {
          console.log('resolver impl args:', obj, args, context)
          return new Promise((resolve, reject) => {
            var requestMapping = Handlebars.compile(value.requestMapping)({
              context: {
                arguments: args
              }
            })
            console.log('requestMapping', requestMapping)

            var request
            try {
              request = JSON.parse(requestMapping)
            } catch (e) {
            // TODO better error message back to user when this happens
              return reject(e)
            }

            var options = {
              host: dataSource.host,
              port: dataSource.port,
              auth: dataSource.basic_auth,
              path: request.path,
              method: request.method
            }
            console.log('options', options)

            const req = http.request(options, (res) => {
              var body = ''
              console.log(`STATUS: ${res.statusCode}`)
              console.log(`HEADERS: ${JSON.stringify(res.headers)}`)
              res.setEncoding('utf8')
              res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`)
                body += chunk
              })
              res.on('end', () => {
                console.log('No more data in response.')
                if (res.statusCode < 200 || res.statusCode > 299) {
                  return reject(new Error(`Got response status:${res.statusCode} body:${body}`))
                }
                var resJson
                try {
                  resJson = JSON.parse(body)
                } catch (e) {
                  return reject(new Error(e))
                }
                console.log('value.responseMapping', value.responseMapping)
                var responseString = Handlebars.compile(value.responseMapping)({
                  context: {
                    result: resJson
                  }
                })
                console.log('responseString', responseString)
                var response
                try {
                  response = JSON.parse(responseString)
                } catch (e) {
                // TODO better error message back to user when this happens
                  return reject(e)
                }

                return resolve(response)
              })
            })

            req.on('error', (e) => {
              console.error(`problem with request: ${e.message}`)
              return reject(new Error(e))
            })

            // write data to request body
            if (request.body) {
              req.write(JSON.stringify(request.body))
            }
            req.end()
          })
        }
      }
    })
  })

  console.log('resolvers', resolvers)

  return resolvers
}

exports.parseFromFile = function (schemaFile, dataSourcesFile, resolverMappingsFile) {
  const schemaString = fs.readFileSync(schemaFile).toString()
  const dataSources = JSON.parse(fs.readFileSync(dataSourcesFile).toString())
  const resolverMappings = JSON.parse(fs.readFileSync(resolverMappingsFile).toString())

  const resolvers = makeResolvers(dataSources, resolverMappings)

  return graphqlTools.makeExecutableSchema({
    typeDefs: [schemaString],
    resolvers
  })
}
