const postgresConfig = require('../server/config').postgresConfig

require('../models')(postgresConfig).sequelize.sync().then(() => {
  console.log('sequelize done')
  process.exit(0)
})
