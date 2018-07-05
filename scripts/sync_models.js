const postgresConfig = require('../server/config').postgresConfig

const forceDrop = process.env.FORCE_DROP === 'true'

if (require.main === module) {
  require('../sequelize/models')(postgresConfig).sequelize.sync({force: forceDrop}).then(() => {
    console.log('sequelize done')
    process.exit(0)
  })
} else {
  throw Error('This file should not be imported. Ever.')
}
