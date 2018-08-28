const Keycloak = require('keycloak-connect')
var session = require('express-session')

const schemaDirectives = require('./schemaDirectives')
const AuthContextProvider = require('./AuthContextProvider')
const { log } = require('../../../lib/util/logger')

class KeycloakSecurityService {
  constructor (keycloakConfig) {
    this.keycloakConfig = keycloakConfig
    this.schemaDirectives = schemaDirectives
    this.AuthContextProvider = AuthContextProvider
  }

  getSchemaDirectives () {
    return this.schemaDirectives
  }

  getAuthContextProvider () {
    return this.AuthContextProvider
  }

  /**
  * Create keycloak middleware if needed.
  *
  * @param {*} expressRouter express router that should be used to attach auth
  * @param {string} apiPath  location of the protected api
  */
  applyAuthMiddleware (expressRouter, apiPath) {
    if (!this.keycloakConfig) {
      return log.info('Keycloak authentication is not configured')
    }

    log.info('Initializing Keycloak authentication')
    const memoryStore = new session.MemoryStore()
    expressRouter.use(session({
      secret: this.keycloakConfig.secret || 'secret',
      resave: false,
      saveUninitialized: true,
      store: memoryStore
    }))

    var keycloak = new Keycloak({
      store: memoryStore
    }, this.keycloakConfig)

    // Install general keycloak middleware
    expressRouter.use(keycloak.middleware({
      admin: apiPath
    }))

    // Protect the main route for all graphql services
    // Disable unauthenticated access
    expressRouter.use(apiPath, keycloak.protect())

    expressRouter.get('/token', keycloak.protect(), function (req, res) {
      let token = req.session['keycloak-token']
      if (token) {
        return res.json({
          'Authorization': 'Bearer ' + JSON.parse(token).access_token
        })
      }
      res.json({})
    })
  }
}

module.exports = KeycloakSecurityService
