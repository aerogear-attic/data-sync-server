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

const notesSchema = {
  id: 2,
  name: 'default',
  schema: `

  type Meme {
    id: ID! @isUnique
    photoUrl: String!
  }
  
  type Query {
    allMemes:[Meme!]!
  }
  
  type Mutation {
    createMeme(photoUrl: String!):Meme!
  }
  
  type Subscription {
    memeAdded(photoUrl: String):Meme!
  }
  
  `,
  createdAt: time,
  updatedAt: time
}

const subscriptions = [
  {
    type: 'Subscription',
    field: 'memeAdded',
    GraphQLSchemaId: 2,
    topic: 'memeCreated',
    createdAt: time,
    updatedAt: time
  }
]

const resolvers = [
  {
    type: 'Query',
    field: 'allMemes',
    DataSourceId: 2,
    GraphQLSchemaId: 2,
    requestMapping: '{"operation": "find", "query": {"_type":"meme"}}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    DataSourceId: 2,
    GraphQLSchemaId: 2,
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
        "memeAdded": {{ toJSON context.result }}
      }`
    }),
    createdAt: time,
    updatedAt: time
  }
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('DataSources', datasources, {})
    await queryInterface.bulkInsert('GraphQLSchemas', [notesSchema], {})
    await queryInterface.bulkInsert('Subscriptions', subscriptions, {})
    return queryInterface.bulkInsert('Resolvers', resolvers, {})
  }
}
