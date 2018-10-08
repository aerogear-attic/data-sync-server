/* eslint no-console: 0 */
const keycloakInit = require('./keycloakInit')
const os = require('os')

function getIpAddress () {
  var ifaces = os.networkInterfaces()

  for (var ifname of Object.keys(ifaces)) {
    for (var iface of ifaces[ifname]) {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        continue
      }

      return iface.address
    }
  }
}

async function init () {
  await keycloakInit.resetKeycloakConfiguration('http://127.0.0.1:8080/auth')
  await keycloakInit.prepareKeycloak('http://127.0.0.1:8080/auth')

  const keycloakUrl = `http://${getIpAddress()}.nip.io:8080/auth`
  var json = `{ "realm": "Memeolist", "auth-server-url": "${keycloakUrl}", "ssl-required": "external", "resource": "sync-server", "public-client": true }`

  var fs = require('fs')
  fs.writeFile('./keycloak/keycloak-local.json', json, function (err) {
    if (err) {
      return console.log('Error creating keycloak-local.json file', err)
    }

    console.log(`A local keycloak as been configured, you can access such instance at ${keycloakUrl}`)
    console.log('username/password: admin/admin')
    console.log('The following users have been created: (username/password)\n')
    console.log('   * voter/voter')
    console.log('   * voter2/voter2')

    console.log('\nTo use this keycloak instance with the syncserver, please use the following command:\n')
    console.log('KEYCLOAK_CONFIG_FILE=./keycloak/keycloak-local.json npm run dev')
  })
}

init()
