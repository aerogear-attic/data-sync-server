class KeycloakAuthContextProvider {
  constructor (request) {
    this.request = request
  }

  getToken () {
    if (this.request.kauth && this.request.kauth.grant && this.request.kauth.grant.access_token) {
      return this.request.kauth.grant.access_token
    }
    return null
  }

  isAuthenticated () {
    return this.getToken() !== null
  }

  getTokenContent () {
    return this.isAuthenticated() ? this.getToken().content : null
  }

  hasRole (role) {
    return this.isAuthenticated() && this.getToken().hasRole(role)
  }
}

module.exports = KeycloakAuthContextProvider
