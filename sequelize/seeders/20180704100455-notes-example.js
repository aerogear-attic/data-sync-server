'use strict'

const time = new Date()

const datasources = [
  {
    name: 'nedb_notes',
    type: 'InMemory',
    config: '{"options":{"timestampData":true}}',
    createdAt: time,
    updatedAt: time
  }
]

const notesSchema = {
  name: 'default',
  schema: `schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }

  # The query type, represents all of the entry points into our object graph
  type Query {
    readNote(id: String): Note
    listNotes: [Note]
  }

  # The mutation type, represents all updates we can make to our data
  type Mutation {
    createNote(
      title: String,
      content: String,
    ): Note
    updateNote(
      id: String,
      title: String,
      content: String
    ): Note
    deleteNote(id: String): Note
  }

  type Note {
    _id: String
    title: String
    content: String
    createdAt: String
    updatedAt: String
  }

  type Subscription {
    noteCreated: Note
  }`,
  createdAt: time,
  updatedAt: time
}

const resolvers = [
  {
    type: 'Query',
    field: 'readNote',
    DataSourceId: 1,
    requestMapping: '{"operation": "findOne","query": {"_id": "{{context.arguments.id}}"}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Query',
    field: 'listNotes',
    DataSourceId: 1,
    requestMapping: '{"operation": "find","query": {}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'createNote',
    DataSourceId: 1,
    requestMapping: '{"operation": "insert","doc": {"title": "{{context.arguments.title}}","content": "{{context.arguments.content}}"}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: time,
    updatedAt: time
  },
  {
    type: 'Mutation',
    field: 'updateNote',
    DataSourceId: 1,
    requestMapping: '{"operation": "update","query": {"_id": "{{context.arguments.id}}"}, "update":{"title": "{{context.arguments.title}}","content": "{{context.arguments.content}}"},"options":{}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: time,
    updatedAt: time
  },
  {
    DataSourceId: 1,
    field: 'deleteNote',
    type: 'Mutation',
    requestMapping: '{"operation": "remove","query": {"_id": "{{context.arguments.id}}"},"options":{}}',
    responseMapping: '{{toJSON context.result}}',
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
