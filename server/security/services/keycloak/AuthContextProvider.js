class KeycloakAuthContextProvider {
  constructor (request) {
    this.request = request
    this.accessToken = (request && request.kauth && request.kauth.grant) ? request.kauth.grant.access_token : undefined
    this.authenticated = !!(this.accessToken)
  }

  getToken () {
    return this.accessToken
  }

  isAuthenticated () {
    return this.authenticated
  }

  getTokenContent () {
    return this.isAuthenticated() ? this.getToken().content : null
  }

  hasRole (role) {
    return this.isAuthenticated() && this.getToken().hasRole(role)
  }
}

module.exports = KeycloakAuthContextProvider
