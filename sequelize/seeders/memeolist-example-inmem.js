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
    type: 'Meme',
    field: 'comments',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{"operation": "find", "query": 
                    {"_type":"comment", "memeId": "{{context.parent.id}}"}}`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'allMemes',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    preHook: '',
    postHook: '',
    requestMapping: '{"operation": "find", "query": {"_type":"meme"}}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'profile',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: '{"operation": "find", "query": {"_type":"profile", "email": "{{context.arguments.email}}" }}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    preHook: '',
    postHook: '',
    requestMapping: `{
      "operation": "insert",
      "doc": {
        "_type":"meme",
        "photoUrl": "{{context.arguments.photoUrl}}",
        "owner": "{{context.arguments.owner}}",
        "likes": 0
      }
    }`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    publish: JSON.stringify({
      topic: 'memeCreated',
      payload: `{
        "memeAdded": {{ toJSON context.result }}
      }`
    }),
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createProfile',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{
      "operation": "insert",
      "doc": {
        "_type":"profile",
        "email": "{{context.arguments.email}}",
        "displayName": "{{context.arguments.displayName}}",
        "pictureUrl": "{{context.arguments.pictureUrl}}"
      }
    }`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'likeMeme',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{
      "operation": "update",
      "query": {"_id": "{{context.arguments.id}}", "_type":"meme"},
      "update": {
        "$inc": { "likes" : 1 }
      }
    }`,
    responseMapping: 'true',
    createdAt: time,
    updatedAt: time
  }, {
    type: 'Mutation',
    field: 'postComment',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{
      "operation": "insert",
      "doc": {
        "_type":"comment",
        "comment": "{{context.arguments.comment}}",
        "owner": "{{context.arguments.owner}}",
        "memeId": "{{context.arguments.memeId}}"
      }
    }`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
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
