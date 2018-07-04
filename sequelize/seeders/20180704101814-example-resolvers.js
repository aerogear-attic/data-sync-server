'use strict'

const resolvers = [
  {
    type: 'Query',
    field: 'readNote',
    DataSourceId: 1,
    requestMapping: '{"operation": "findOne","query": {"_id": "{{context.arguments.id}}"}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: '2018-07-03 10:11:30.054 +00:00',
    updatedAt: '2018-07-03 10:11:30.054 +00:00'
  },
  {
    type: 'Query',
    field: 'listNotes',
    DataSourceId: 1,
    requestMapping: '{"operation": "find","query": {}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: '2018-07-03 10:11:30.054 +00:00',
    updatedAt: '2018-07-03 10:11:30.054 +00:00'
  },
  {
    type: 'Mutation',
    field: 'createNote',
    DataSourceId: 1,
    requestMapping: '{"operation": "insert","doc": {"title": "{{context.arguments.title}}","content": "{{context.arguments.content}}"}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: '2018-07-03 10:11:30.054 +00:00',
    updatedAt: '2018-07-03 10:11:30.054 +00:00'
  },
  {
    type: 'Mutation',
    field: 'updateNote',
    DataSourceId: 1,
    requestMapping: '{"operation": "update","query": {"_id": "{{context.arguments.id}}"}, "update":{"title": "{{context.arguments.title}}","content": "{{context.arguments.content}}"},"options":{}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: '2018-07-03 10:11:30.054 +00:00',
    updatedAt: '2018-07-03 10:11:30.054 +00:00'
  },
  {
    DataSourceId: 1,
    field: 'deleteNote',
    type: 'Mutation',
    requestMapping: '{"operation": "remove","query": {"_id": "{{context.arguments.id}}"},"options":{}}',
    responseMapping: '{{toJSON context.result}}',
    createdAt: '2018-07-03 10:11:30.054 +00:00',
    updatedAt: '2018-07-03 10:11:30.054 +00:00'
  }
]

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Resolvers', resolvers, {})
  }
}
