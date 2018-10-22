'use strict'

const { schema } = require('./user-example-shared')

const time = new Date()

const datasources = [
  {
    id: 1,
    name: 'users_Mongo',
    type: 'Mongo',
    config: `{"options":{
      "url": "mongodb://localhost:27017",
      "database": "users"
    }}`,
    createdAt: time,
    updatedAt: time
  }
]

const resolvers = [
  {
    type: 'Query',
    field: 'allUsers',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db.collection('user').find({}).toArray()`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'getUser',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db.collection('user').findOne({_id: ObjectId(resolve.args.id)})`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createUser',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db.collection('user').insertOne(resolve.args).then((result) => result.ops[0])`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'updateUser',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db.collection('user').findOneAndUpdate({ _id: ObjectId(resolve.args.id) }, { $set: resolve.args}, {returnOriginal: false}).then((result) => result.value)`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  }
]

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('DataSources', datasources, {})
    await queryInterface.bulkInsert('GraphQLSchemas', [schema], {})
    // await queryInterface.bulkInsert('Subscriptions', subscriptions, {})
    return queryInterface.bulkInsert('Resolvers', resolvers, {})
  }
}
