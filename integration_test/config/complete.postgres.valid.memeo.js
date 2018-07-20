'use strict'

const time = new Date()

const memeoListDbHost = process.env.MEMEOLIST_DB_HOST || '127.0.0.1'
const memeoListDbPort = process.env.MEMEOLIST_DB_PORT || '15432'

const datasources = [
  {
    id: 2,
    name: 'nedb_postgres',
    type: 'Postgres',
    config: `{"options":{
      "user": "postgresql",
      "password": "postgres",
      "database": "memeolist_db",
      "host": "${memeoListDbHost}",
      "port": "${memeoListDbPort}",
      "dialect": "postgres"
    }}`,
    createdAt: time,
    updatedAt: time
  }
]

const notesSchema = {
  id: 2,
  name: 'default',
  // language=GraphQL
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
          photoUrl: String!
          ownerId: String!
      }

      type Query {
          allProfiles:[Profile!]!
          profile(email: String!):Profile
          allMemes:[Meme!]!
      }

      type Mutation {
          createProfile(email: String!, displayName: String!, biography: String!, avatarUrl: String!):Profile!
          updateProfile(id: ID!, email: String!, displayName: String!, biography: String!, avatarUrl: String!):Profile
          deleteProfile(id: ID!):Boolean!
          createMeme(ownerId: String!, photoUrl: String!):Meme!
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
    field: 'allMemes',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: 'SELECT "id", "photoUrl", "ownerId" FROM "Meme"',
    responseMapping: '{{ toJSON context.result }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'profile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `SELECT "id", "email", "displayName", "biography", "avatarUrl" FROM "Profile" where "email"='{{context.arguments.email}}'`,
    responseMapping: '{{ toJSON context.result.[0] }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `
      INSERT INTO "Meme" ("ownerId", "photoUrl") 
      VALUES ('{{context.arguments.ownerId}}', '{{context.arguments.photoUrl}}') 
      RETURNING *;`,
    responseMapping: '{{ toJSON context.result.[0] }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Profile',
    field: 'memes',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `SELECT "id", "ownerId", "photoUrl" FROM "Meme" where "ownerId"={{context.parent.id}}`,
    responseMapping: '{{ toJSON context.result }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'allProfiles',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: 'SELECT "id", "email", "displayName", "biography", "avatarUrl" FROM "Profile"',
    responseMapping: '{{ toJSON context.result }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `
      INSERT INTO "Profile" ("email", "displayName", "biography", "avatarUrl") 
      VALUES ('{{context.arguments.email}}', '{{context.arguments.displayName}}','{{context.arguments.biography}}', '{{context.arguments.avatarUrl}}') 
      RETURNING *;`,
    responseMapping: '{{ toJSON context.result.[0] }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'updateProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `
      UPDATE "Profile" SET 
        "email" = '{{ context.arguments.email }}', 
        "displayName" = '{{ context.arguments.displayName }}', 
        "biography" = '{{ context.arguments.biography }}', 
        "avatarUrl" = '{{ context.arguments.avatarUrl }}' 
      WHERE "id"='{{context.arguments.id}}'
      RETURNING *;`,
    responseMapping: '{{ toJSON context.result.[0] }}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'deleteProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `
      DELETE from "Profile"  
        WHERE "id"='{{context.arguments.id}}'
      RETURNING *;`,
    responseMapping: '{{ toJSON context.result.[0] }}',
    // responseMapping: '{{toBoolean context.result}}',
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
module.exports.description = 'A complex valid config that uses a in-mem data source'
