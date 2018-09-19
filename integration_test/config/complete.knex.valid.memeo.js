'use strict'

const time = new Date()

const memeoListDbHost = process.env.MEMEOLIST_DB_HOST || '127.0.0.1'
const memeoListDbPort = process.env.MEMEOLIST_DB_PORT || '15432'

const datasources = [
  {
    id: 2,
    name: 'knex_memeolist',
    type: 'Knex',
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
    requestMapping: 'return db.select().from("Meme")',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'profile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `return db.select().from("Profile").where("email", resolve.args.email).then((rows) => rows[0])`,
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `let meme = {
      ownerId: resolve.args.ownerId,
      photoUrl: resolve.args.photoUrl
    }

    return db('Meme').insert(meme).returning('*').then((rows) => rows[0])`,
    publish: 'memeAdded',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Profile',
    field: 'memes',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    publish: 'memeAdded',
    requestMapping: `return db.select().from('Meme').where("ownerId", resolve.parent.id)`,
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'allProfiles',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `return db.select().from('Profile')`,
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `const profile = resolve.args
    return db("Profile").insert(profile).returning('*').then((rows) => rows[0])`,
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'updateProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `
    const { email, displayName, biography, avatarUrl } = resolve.args
    
    return db("Profile").update({ email, displayName, biography, avatarUrl }).where('id', resolve.args.id).returning('*').then((rows) => rows[0])`,
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'deleteProfile',
    GraphQLSchemaId: 2,
    DataSourceId: 2,
    requestMapping: `return db('Profile').delete().where('id', resolve.args.id).then((rows) => true)`,
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
module.exports.description = 'A complex valid config that uses a Postgres data source'
