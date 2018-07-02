const fs = require('fs')
const graphqlTools = require('graphql-tools')

const dataSourceParser = require('./dataSourceParser')
const resolverMaker = require('./resolverMaker')

module.exports = function (schemaFile, dataSourcesFile, resolverMappingsFile) {
  let schemaString
  let dataSourcesJson
  let resolverMappingsJson

  try {
    schemaString = fs.readFileSync(schemaFile).toString()
  } catch (ex) {
    console.error('Unable to read SCHEMA_FILE ' + schemaFile)
    console.error(ex)
    throw new Error('Unable to read SCHEMA_FILE ' + schemaFile)
  }

  try {
    dataSourcesJson = JSON.parse(fs.readFileSync(dataSourcesFile).toString())
  } catch (ex) {
    console.error('Unable to read or parse DATA_SOURCES_FILE ' + dataSourcesFile)
    console.error(ex)
    throw new Error('Unable to read or parse DATA_SOURCES_FILE ' + dataSourcesFile)
  }

  try {
    resolverMappingsJson = JSON.parse(fs.readFileSync(resolverMappingsFile).toString())
  } catch (ex) {
    console.error('Unable to read or parse RESOLVER_MAPPINGS_FILE ' + resolverMappingsFile)
    console.error(ex)
    throw new Error('Unable to read or parse RESOLVER_MAPPINGS_FILE ' + resolverMappingsFile)
  }

  const {dataSourceTypes, dataSourceClients} = dataSourceParser(dataSourcesJson)
  const resolvers = resolverMaker(dataSourceTypes, dataSourceClients, resolverMappingsJson)

  return graphqlTools.makeExecutableSchema({
    typeDefs: [schemaString],
    resolvers: resolvers
  })
}
