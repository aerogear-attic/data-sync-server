'use strict'

const {memeoListSchema} = require('./memeolist-example-shared')

const time = new Date()

const datasources = [
  {
    id: 1,
    name: 'nedb_postgres',
    type: 'Postgres',
    config: `{"options":{
      "user": "postgresql",
      "password": "postgres",
      "database": "memeolist_db",
      "host": "127.0.0.1",
      "port": "15432",
      "dialect": "postgres"
    }}`,
    createdAt: time,
    updatedAt: time
  }
]

const resolvers = [
  {
    type: 'Query',
    field: 'allMemes',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: 'SELECT "id", "photoUrl" FROM "Meme"',
    responseMapping: '{{ toJSON context.result }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `INSERT INTO "Meme" ("photoUrl") VALUES ('{{context.arguments.photoUrl}}') RETURNING *;`,
    responseMapping: '{{ toJSON context.result.[0] }}',
    createdAt: time,
    updatedAt: time
  }
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('DataSources', datasources, {})
    await queryInterface.bulkInsert('GraphQLSchemas', [memeoListSchema], {})
    return queryInterface.bulkInsert('Resolvers', resolvers, {})
  }
}
