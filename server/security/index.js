const { log } = require('../lib/util/logger')
const Keycloak = require('keycloak-connect')
var session = require('express-session')

const config = require('../config')

/**
 * Create keycloak middleware if needed.
 *
 * @param {*} expressRouter
 */
exports.applyAuthMiddleware = (expressRouter, apiPath) => {
  if (config.keycloakConfig) {
    log.info('Initializing Keycloak authentication')
    const memoryStore = new session.MemoryStore()
    expressRouter.use(session({
      secret: config.secret || 'secret',
      resave: false,
      saveUninitialized: true,
      store: memoryStore
    }))

    var keycloak = new Keycloak({
      store: memoryStore
    }, config.keycloakConfig)

    // Install general keycloak middleware
    expressRouter.use(keycloak.middleware())

    // Protect the main route for all graphql services
    // (disable unauthenticated access)
    expressRouter.use(apiPath, keycloak.protect())
  } else {
    log.info('Keycloak authentication is not configured')
  }
}
