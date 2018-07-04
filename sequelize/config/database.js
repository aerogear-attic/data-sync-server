const { postgresConfig } = require('../../server/config')

module.exports = {
  development: {
    ...postgresConfig,
    dialect: 'postgres'
  }
}
