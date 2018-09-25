'use strict'

const { schema, subscriptions } = require('./memeolist-example-shared')

const time = new Date()

const datasources = [
  {
    id: 1,
    name: 'memeolist_Mongo',
    type: 'Mongo',
    config: `{"options":{
      "url": "mongodb://localhost:27017",
      "database": "memeolist"
    }}`,
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
    requestMapping: `return {}`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Meme',
    field: 'comments',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return []`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Profile',
    field: 'memes',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db.select().from('meme').where('owner', resolve.parent.id)`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'allMemes',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db.collection('meme').find({}).next()`,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'profile',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db.select().from('profile').where('email', resolve.args.email)`,
    responseMapping: 'result[0]',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createMeme',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `let meme = {
  owner: resolve.args.owner,
  photourl: resolve.args.photourl,
  likes: 0
}

return db('meme').insert(meme).returning('*')
    `,
    responseMapping: 'result[0]',
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
    requestMapping: `let profile = {
  email: resolve.args.email,
  displayname: resolve.args.displayname,
  pictureurl: resolve.args.pictureurl
}

return db('profile').insert(profile).returning('*').then((rows) => {
  return rows[0]
})
    `,
    responseMapping: '',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'likeMeme',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `return db('meme').where('id', resolve.args.id).increment('likes', 1)`,
    responseMapping: 'true',
    createdAt: time,
    updatedAt: time
  }, {
    type: 'Mutation',
    field: 'postComment',
    DataSourceId: 1,
    GraphQLSchemaId: 1,
    requestMapping: `let comment = {
  comment: resolve.args.comment,
  owner: resolve.args.owner,
  memeid: resolve.args.memeid
}

return db('comment').insert(comment).returning('*')
`,
    responseMapping: 'result[0]',
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
