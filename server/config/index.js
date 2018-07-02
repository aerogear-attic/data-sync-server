const fs = require('fs')

const schemaFile = process.env.SCHEMA_FILE
const dataSourcesFile = process.env.DATA_SOURCES_FILE
const resolverMappingsFile = process.env.RESOLVER_MAPPINGS_FILE
const queryFile = process.env.QUERY_FILE
let query

if (schemaFile == null || schemaFile === 0) {
  console.error('process.env.SCHEMA_FILE not defined')
  process.exit(1)
}

if (dataSourcesFile == null || dataSourcesFile.length === 0) {
  console.error('process.env.DATA_SOURCES_FILE not defined')
  process.exit(1)
}

if (resolverMappingsFile == null || resolverMappingsFile.length === 0) {
  console.error('process.env.RESOLVER_MAPPINGS_FILE not defined')
  process.exit(1)
}

if (queryFile && queryFile.length > 0) {
  query = fs.readFileSync(queryFile).toString()
}

var config = {
  server: {
    port: process.env.HTTP_PORT || '8000'
  },
  graphQLConfig: {
    schemaFile,
    dataSourcesFile,
    resolverMappingsFile,
    tracing: true
  },
  graphiqlConfig: {
    endpointURL: '/graphql', // if you want GraphiQL enabled
    query
  }
}

module.exports = config
