'use strict'

const datasources = [
  {
    name: 'nedb_notes',
    type: 'InMemory',
    config: '{"options":{"timestampData":true}}',
    createdAt: '2018-07-03 10:11:30.054 +00:00',
    updatedAt: '2018-07-03 10:11:30.054 +00:00'
  }
]

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('DataSources', datasources, {})
  }
}
