const express = require('express')
const cors = require('cors')
const { runHealthChecks } = require('./health')
const { log, getClientInfoFromHeaders, auditLogEnabled } = require('./lib/util/logger')
const { ApolloError } = require('apollo-server-express')

const VALIDATION_ERROR = 'VALIDATION_ERROR'

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

  if (auditLogEnabled) {
    app.use(function (req, res, next) {
      try {
        req.clientInfo = getClientInfoFromHeaders(req)
      } catch (e) {
        log.error('Error getting client info.')
        log.error(e)
        const message = 'Error decoding/parsing malformed client info. Message: ' + e.message

        // for some reason, the first parameter (message) is not sent to clients.
        // adding the same message as "msg" in the error message separately.
        return res.status(400).send(new ApolloError(message, VALIDATION_ERROR, { msg: message }))
      }

      next()
    })
  }

  return app
}

module.exports = newExpressApp
