const postgresConfig = require('../server/config').postgresConfig

require('../sequelize/models')(postgresConfig).sequelize.sync({force: true}).then(() => {
  console.log('sequelize done')
  process.exit(0)
})
