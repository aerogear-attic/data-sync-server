const { postgresConfig } = require('../../server/config')

module.exports = {
  development: {
    database: postgresConfig.database,
    username: postgresConfig.user,
    password: postgresConfig.password,
    host: postgresConfig.host,
    dialect: 'postgres'
  }
}
