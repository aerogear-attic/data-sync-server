'use strict'

const time = new Date()

const datasources = [
  {
    id: 1,
    name: 'nedb_notes',
    type: 'InMemory',
    config: '{"options":{"timestampData":true}}',
    createdAt: time,
    updatedAt: time
  }
]

const notesSchema = {
  id: 1,
  name: 'default',
  // language=GraphQL
  schema: `
  
  schema {
    query: Query
  }

  type Query {
    someQuery: Boolean
  }
    
  `,
  createdAt: time,
  updatedAt: time
}

const resolvers = [
  {
    type: 'Query',
    field: 'DOES_NOT_EXIST_IN_THE_SCHEMA',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: 'DOES NOT MATTER',
    responseMapping: 'DOES NOT MATTER',
    createdAt: time,
    updatedAt: time
  }
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('DataSources', datasources, {})
    await queryInterface.bulkInsert('GraphQLSchemas', [notesSchema], {})
    return queryInterface.bulkInsert('Resolvers', resolvers, {})
  }
}

// IMPORTANT: please describe the config here. things would be complicated for test maintainers otherwise
module.exports.description = 'A simplified invalid config that has a resolver that does not have a query in the schema'
