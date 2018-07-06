const postgresConfig = require('../config').postgresConfig
const {addCriticalTest, runTests} = require('fh-health')
const db = require('../../sequelize/models')(postgresConfig)

addCriticalTest('Database connectivity', cb => {
  db.sequelize.authenticate()
    .then(() => cb(null, 'Database connectivity check successful'))
    .catch(err => cb(err))
})

module.exports = function (App) {
  App.get('/healthz', (req, res) => {
    runTests((err, data) => {
      if (err) {
        return res.sendStatus(500)
      }

      return res.json(JSON.parse(data))
    })
  })
}
