const postgresConfig = require('../server/config').postgresConfig

const forceDrop = process.env.FORCE_DROP === 'true'

require('../sequelize/models')(postgresConfig).sequelize.sync({force: forceDrop}).then(() => {
  console.log('sequelize done')
  process.exit(0)
})
