const express = require('express')
const cors = require('cors')
const { runHealthChecks } = require('./health')

function newExpressApp (options, middlewares, securityService) {
  let app = express()
  const { metrics, responseLoggingMetric, logging } = middlewares
  const { graphqlEndpoint, models } = options

  app.use(responseLoggingMetric)
  app.use('*', cors())
  app.use(logging)

  app.get('/healthz', async (req, res) => {
    const result = await runHealthChecks(models)
    if (!result.ok) {
      res.status(503)
    }
    res.json(result)
  })

  app.get('/metrics', metrics)

  if (securityService) {
    securityService.applyAuthMiddleware(app, graphqlEndpoint)
  }

  return app
}

module.exports = newExpressApp
