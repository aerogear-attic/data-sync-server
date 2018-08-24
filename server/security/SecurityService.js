const securityServices = require('./services')
class SecurityService {
  constructor ({ type, config }) {
    const SecurityServiceImplementation = securityServices[type]

    if (!SecurityServiceImplementation) {
      throw new Error(`Unsupported security service type ${type}`)
    }

    this.instance = new SecurityServiceImplementation(config)
  }

  getSchemaDirectives () {
    return this.instance.schemaDirectives
  }

  getAuthContextProvider () {
    return this.instance.AuthContextProvider
  }

  applyAuthMiddleware (...args) {
    this.instance.applyAuthMiddleware(...args)
  }
}

module.exports = SecurityService
