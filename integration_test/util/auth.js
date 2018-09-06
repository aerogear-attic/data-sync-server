const axios = require('axios')

async function authenticateKeycloak (config, username, password) {
  const res = await axios({
    method: 'post',
    url: `${config['auth-server-url']}/realms/${config.realm}/protocol/openid-connect/token`,
    data: `client_id=${config.resource}&username=${username}&password=${password}&grant_type=password`
  })
  return { Authorization: `Bearer ${res.data['access_token']}` }
}

module.exports = { authenticateKeycloak }
