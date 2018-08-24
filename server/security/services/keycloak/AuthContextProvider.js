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
}

module.exports = KeycloakAuthContextProvider
