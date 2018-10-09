const postgresConfig = require('../server/config').postgresConfig

const forceDrop = process.env.FORCE_DROP === 'true'

if (require.main === module) {
  require('@aerogear/data-sync-gql-core').models(postgresConfig).sequelize.sync({force: forceDrop}).then(() => {
    process.exit(0)
  })
} else {
  throw Error('This file should not be imported. Ever.')
}
