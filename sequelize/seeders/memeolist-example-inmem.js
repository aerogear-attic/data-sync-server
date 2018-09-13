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
    field: 'owner',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{"operation": "find", "query": 
                    {"_type":"profile", "id": "{{context.parent.owner}}"}}`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Profile',
    field: 'memes',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{"operation": "find", "query": 
                    {"_type":"meme", "owner": "{{context.parent.id}}"}}`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Comment',
    field: 'owner',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `{"operation": "find", "query": 
                    {"_type":"profile", "id": "{{context.parent.owner}}"}}`,
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
    type: 'Query',
    field: 'comments',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: '{"operation": "find", "query": {"_type":"comment", "memeid": "{{context.arguments.memeid}}" }}',
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
        "photourl": "{{context.arguments.photourl}}",
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
        "displayname": "{{context.arguments.displayname}}",
        "pictureurl": "{{context.arguments.pictureurl}}"
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
        "memeid": "{{context.arguments.memeid}}"
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
