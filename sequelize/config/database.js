const { postgresConfig } = require('../../server/config')

module.exports = {
  development: {
    database: postgresConfig.database,
    username: postgresConfig.username,
    password: postgresConfig.password,
    host: postgresConfig.options.host,
    dialect: 'postgres'
  }
}
