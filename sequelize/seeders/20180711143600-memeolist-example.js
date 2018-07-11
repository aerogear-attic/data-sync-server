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
  name: 'default',
  schema: `
  
  type Profile {
    id: ID! @isUnique
    email: String! @isUnique
    displayName: String!
    biography: String!
    avatarUrl: String!
    memes: [Meme]!
  }
  
  type Meme {
    id: ID! @isUnique
  }
  
  type Query {
    allProfiles:[Profile!]!
    profile(email: String!):Profile!
  }
  
  type Mutation {
    createProfile(email: String!, displayName: String!, biography: String!, avatarUrl: String!):Profile!
    updateProfile(id: ID!, email: String!, display_name: String!, biography: String!, pictureUrl: String!):Profile!
    deleteProfile(id: ID!):Boolean!
  }
  
  type Subscription {
    _: Boolean
  }
  
  `,
  createdAt: time,
  updatedAt: time
}

const resolvers = [
  {
    type: 'Query',
    field: 'allProfiles',
    DataSourceId: 2,
    requestMapping: '{"operation": "find", "query": {"_type":"profile"}}',
    responseMapping: '{{ toJSON (convertNeDBIds context.result) }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createProfile',
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
  }
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('DataSources', datasources, {})
    await queryInterface.bulkInsert('GraphQLSchemas', [notesSchema], {})
    return queryInterface.bulkInsert('Resolvers', resolvers, {})
  }
}
