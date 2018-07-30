'use strict'

const time = new Date()

const datasources = [
  {
    id: 2,
    name: 'nedb_memeolist',
    type: 'InMemory',
    config: '{"options":{"timestampData":true}}',
    createdAt: time,
    updatedAt: time
  }
]

const schema = require('./complete.valid.memeo.schema.only')

const subscriptions = [
  {
    type: 'Subscription',
    field: 'memeAdded',
    GraphQLSchemaId: 2,
    createdAt: time,
    updatedAt: time
  }
]

const resolvers = [
  {
    type: 'Query',
    field: 'allMemes',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: '{"operation": "find", "query": {"_type":"meme"}}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'profile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `{
      "operation": "findOne",
      "query": {"_type":"profile", "email": "{{context.arguments.email}}" }
    }`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `{
      "operation": "insert",
      "doc": {
        "_type":"meme",
        "photoUrl": "{{context.arguments.photoUrl}}",
        "ownerId": "{{context.arguments.ownerId}}"
      }
    }`,
    publish: 'memeAdded',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Profile',
    field: 'memes',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: '{"operation": "find", "query": {"_type":"meme", "ownerId": "{{context.parent.id}}"}}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'allProfiles',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: '{"operation": "find", "query": {"_type":"profile"}}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `{
      "operation": "insert",
      "doc": {
        "_type":"profile",
        "email": "{{context.arguments.email}}",
        "displayName": "{{context.arguments.displayName}}",
        "biography": "{{context.arguments.biography}}",
        "avatarUrl": "{{context.arguments.avatarUrl}}",
        "memes": []
      }
    }`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'updateProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `{
      "operation": "update",
      "query": {"_type":"profile", "_id": "{{context.arguments.id}}" },
      "update": { 
        "$set": {
          "email": "{{context.arguments.email}}",
          "displayName": "{{context.arguments.displayName}}", 
          "biography": "{{context.arguments.biography}}",    
          "avatarUrl": "{{context.arguments.avatarUrl}}"
        }    
      },
      "options": {
        "returnUpdatedDocs": true
      }
    }`,
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'deleteProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `{
      "operation": "remove",
      "query": {"_type":"profile", "_id": "{{context.arguments.id}}" }
    }`,
    responseMapping: '{{toBoolean context.result}}',
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

// IMPORTANT: please describe the config here. things would be complicated for test maintainers otherwise
module.exports.description = 'A complex valid config that uses a in-mem data source'
