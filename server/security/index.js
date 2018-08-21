const { log } = require('../lib/util/logger')
const Keycloak = require('keycloak-connect')
var session = require('express-session')

/**
 * Create keycloak middleware if needed.
 *
 * @param {*} keycloakConfig keycloak server specific configuration
 * @param {*} expressRouter express router that should be used to attach auth
 * @param {string} apiPath  location of the protected api
 */
exports.applyAuthMiddleware = (keycloakConfig, expressRouter, apiPath) => {
  if (keycloakConfig) {
    log.info('Initializing Keycloak authentication')
    const memoryStore = new session.MemoryStore()
    expressRouter.use(session({
      secret: keycloakConfig.secret || 'secret',
      resave: false,
      saveUninitialized: true,
      store: memoryStore
    }))

    var keycloak = new Keycloak({
      store: memoryStore
    }, keycloakConfig)

    // Install general keycloak middleware
    expressRouter.use(keycloak.middleware())

    // Protect the main route for all graphql services
    // Disable unauthenticated access
    expressRouter.use(apiPath, keycloak.protect())
  } else {
    log.info('Keycloak authentication is not configured')
  }
}
