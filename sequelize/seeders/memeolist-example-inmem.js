'use strict'

const { schema, subscriptions } = require('./memeolist-example-shared')

const time = new Date()

const datasources = [
  {
    id: 1,
    name: 'nedb_memeolist',
    type: 'InMemory',
    config: '{"options":{"timestampData":true}}',
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
    requestMapping: '{"operation": "find", "query": {"_type":"meme"}}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{
      "operation": "insert",
      "doc": {
        "_type":"meme",
        "photoUrl": "{{context.arguments.photoUrl}}"
      }
    }`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    publish: JSON.stringify({
      topic: 'memeCreated',
      payload: `{
        "memeAdded": {{ toJSON context.result }},
      }`
    }),
    createdAt: time,
    updatedAt: time
  }
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('DataSources', datasources, {})
    await queryInterface.bulkInsert('GraphQLSchemas', [schema], {})
    await queryInterface.bulkInsert('Subscriptions', subscriptions, {})
    return queryInterface.bulkInsert('Resolvers', resolvers, {})
  }
}
