const fs = require('fs')
const graphqlTools = require('graphql-tools')
// const graphqlSubscriptions = require('graphql-subscriptions')
const _ = require('lodash')
const { Client } = require('pg')
const Handlebars = require('handlebars')
Handlebars.registerHelper('toJSON', function (json) {
  return new Handlebars.SafeString(JSON.stringify(json))
})

let dataSourceClients = {}

// const pubsub = new graphqlSubscriptions.PubSub()
// const CREATED_NOTE_TOPIC = 'new_note'

// const resolvers = {
//   Query: {
//     readNote: (root, { id }) => {
//       console.log('notes readNote', id)
//       // return models.Note.findById(id);
//       return null
//     },
//     listNotes: () => {
//       console.log('notes listNotes')
//       // return models.Note.findAll();
//       return []
//     }
//   },
//   Mutation: {
//     createNote: (root, { note }) => {
//       // let newNote = models.Note.build(note).save();
//       // This is a simplified pub/sub setup that doesn't take
//       // into account if the model created OK, or return the
//       // resulting created model
//       pubsub.publish(CREATED_NOTE_TOPIC, {noteCreated: note})
//       return note
//     },
//     updateNote: (root, { note }) => {
//       return note
//       // return models.Note.findById(note.id).then((existing_note) => {
//       //   return existing_note.update(note);
//       // });
//     },
//     deleteNote: (root, { note }) => {
//       return note
//       // return models.Note.findById(note.id).then((existing_note) => {
//       //   return existing_note.destroy({force: true});
//       // });
//     }
//   },
//   Subscription: {
//     noteCreated: {
//       subscribe: graphqlSubscriptions.withFilter(
//         () => pubsub.asyncIterator(CREATED_NOTE_TOPIC),
//         (payload, variables) => {
//           return payload !== undefined
//           // return (payload !== undefined) &&
//           // ((variables.episode === null) || (payload.reviewAdded.episode === variables.episode));
//         }
//       )
//     }
//   }
// }

function makeResolvers (dataSources, resolverMappings) {
  // connect to any datasources with persistent connections
  _.forEach(dataSources, (value, key) => {
    console.log('dataSources', value, key)
    if (value.type === 'postgres') {
      console.log('dataSources value', value)
      dataSourceClients[key] = new Client(value.config)
      dataSourceClients[key].connect()
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
      var dataSource = dataSources[value.dataSource]
      if (dataSource.type === 'postgres') {
        var dataSourceClient = dataSourceClients[value.dataSource]
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
