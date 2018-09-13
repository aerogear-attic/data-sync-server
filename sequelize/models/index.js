const core = require('@aerogear/data-sync-gql-core')
const { postgresConfig } = require('../../server/config')

const models = core.models(postgresConfig)

module.exports = models
