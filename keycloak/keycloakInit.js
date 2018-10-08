const axios = require('axios')
const realmToImport = require('./realm-export.json')

const config = {
  appRealmName: 'Memeolist',
  adminRealmName: 'master',
  resource: 'admin-cli',
  username: 'admin',
  password: 'admin',
  token: null,
  authServerUrl: null
}

const usersConfiguration = [
  { name: 'test-admin', realmRoles: ['admin'], clientId: 'sync-server', clientRoleName: 'admin' },
  { name: 'voter', realmRoles: ['admin', 'voter'], clientId: 'sync-server', clientRoleName: 'voter', email: 'voter@redhat.com', firstName: 'voter', lastName: 'voter' },
  { name: 'voter2', realmRoles: ['admin', 'voter'], clientId: 'sync-server', clientRoleName: 'voter', email: 'voter2@redhat.com', firstName: 'voter2', lastName: 'voter2' }
]

async function getRealmRoles () {
  const res = await axios({
    method: 'GET',
    url: `${config.authServerUrl}/admin/realms/${config.appRealmName}/roles`,
    headers: {'Authorization': config.token}
  }).catch((err) => { throw Error(err) })

  return res.data
}

async function getClients () {
  const res = await axios({
    method: 'GET',
    url: `${config.authServerUrl}/admin/realms/${config.appRealmName}/clients`,
    headers: {'Authorization': config.token}
  }).catch((err) => { throw Error(err) })

  return res.data
}

async function getClientRoles (client) {
  const res = await axios({
    method: 'GET',
    url: `${config.authServerUrl}/admin/realms/${config.appRealmName}/clients/${client.id}/roles`,
    headers: {'Authorization': config.token}
  }).catch((err) => { throw Error(err) })
  return res.data
}

async function assignRealmRoleToUser (userIdUrl, role) {
  const res = await axios({
    method: 'POST',
    url: `${userIdUrl}/role-mappings/realm`,
    data: [role],
    headers: {'Authorization': config.token, 'Content-Type': 'application/json'}
  }).catch((err) => { throw Error(err) })

  return res.data
}

async function assignClientRoleToUser (userIdUrl, client, role) {
  const res = await axios({
    method: 'POST',
    url: `${userIdUrl}/role-mappings/clients/${client.id}`,
    data: [role],
    headers: {'Authorization': config.token, 'Content-Type': 'application/json'}
  }).catch((err) => { throw Error(err) })
  return res.data
}

/// //////////////////////////////////////////////

async function createUser (user) {
  const res = await axios({
    method: 'post',
    url: `${config.authServerUrl}/admin/realms/${config.appRealmName}/users`,
    data: {
      'username': user.name,
      'credentials': [{'type': 'password', 'value': user.name, 'temporary': false}],
      'email': user.email,
      'enabled': true,
      'firstName': user.firstName,
      'lastName': user.lastName
    },
    headers: {'Authorization': config.token, 'Content-Type': 'application/json'}
  }).catch((err) => { throw Error(err) })

  return res.headers.location
}

async function authenticateKeycloak () {
  const res = await axios({
    method: 'POST',
    url: `${config.authServerUrl}/realms/${config.adminRealmName}/protocol/openid-connect/token`,
    data: `client_id=${config.resource}&username=${config.username}&password=${config.password}&grant_type=password`
  }).catch((err) => { throw Error(err) })
  return `Bearer ${res.data['access_token']}`
}

async function importRealm () {
  await axios({
    method: 'POST',
    url: `${config.authServerUrl}/admin/realms`,
    data: realmToImport,
    headers: {'Authorization': config.token, 'Content-Type': 'application/json'}
  }).catch((err) => { throw Error(err) })
}

async function prepareKeycloak (authServerUrl) {
  config.authServerUrl = authServerUrl
  config.token = await authenticateKeycloak()
  await importRealm()
  const realmRoles = await getRealmRoles()
  const clients = await getClients()

  usersConfiguration.forEach(async user => {
    // Create a new user
    const userIdUrl = await createUser(user)
    // Assign realm role to user
    if (user.realmRoles) {
      for (var roleName of user.realmRoles) {
        const selectedRealmRole = realmRoles.find(role => role.name === roleName)
        await assignRealmRoleToUser(userIdUrl, selectedRealmRole)
      }
    }
    // Assign client role to user
    if (user.clientId && user.clientRoleName) {
      const selectedClient = clients.find(client => client.clientId === user.clientId)
      const clientRoles = await getClientRoles(selectedClient)
      const selectedClientRole = clientRoles.find(clientRole => clientRole.name === user.clientRoleName)
      // console.log(selectedClient, clientRoles)
      await assignClientRoleToUser(userIdUrl, selectedClient, selectedClientRole)
    }
  })
}

async function resetKeycloakConfiguration (authServerUrl) {
  config.authServerUrl = authServerUrl
  config.token = await authenticateKeycloak()
  await axios({
    method: 'DELETE',
    url: `${config.authServerUrl}/admin/realms/${config.appRealmName}`,
    headers: {'Authorization': config.token}
  }).catch((err) => { /* return throw Error(err) */ }) // eslint-disable-line handle-callback-err
}

module.exports = {
  prepareKeycloak,
  resetKeycloakConfiguration
}
