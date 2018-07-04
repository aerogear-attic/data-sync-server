'use strict'

const notesSchema = {
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
  createdAt: '2018-07-03 10:11:30.054 +00:00',
  updatedAt: '2018-07-03 10:11:30.054 +00:00'
}

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('GraphQLSchemas', [notesSchema], {})
  }
}
