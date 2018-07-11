const Handlebars = require('handlebars')
const { log } = require('../util/logger')

Handlebars.registerHelper('toJSON', function (json) {
  return new Handlebars.SafeString(JSON.stringify(json))
})

Handlebars.registerHelper('toBoolean', function (result) {
  return new Handlebars.SafeString(!!result)
})

Handlebars.registerHelper('convertNeDBIds', function (json) {
  if (Array.isArray(json)) {
    for (let item of json) {
      if (item && item._id) {
        item.id = item._id
      }
    }
  } else if (json && json._id) {
    json.id = json._id
  }

  return json
})

function compileMappings (requestMapping, responseMapping) {
  // use Handlebars.precompile to fail early during initialization
  try {
    Handlebars.precompile(requestMapping)
  } catch (ex) {
    log.error('Compilation error in requestMapping: ' + requestMapping)
    log.error(ex)
    throw (ex)
  }

  try {
    Handlebars.precompile(responseMapping)
  } catch (ex) {
    log.error('Compilation error in response mapping: ' + responseMapping)
    log.error(ex)
    throw (ex)
  }

  const compiledRequestMapping = Handlebars.compile(requestMapping)
  const compiledResponseMapping = Handlebars.compile(responseMapping)

  return { compiledRequestMapping, compiledResponseMapping }
}

module.exports = {
  compileMappings
}
