
if (require.main === module) {
  require('../keycloak').init()
} else {
  throw Error('This file should not be imported. Ever.')
}
