const Handlebars = require('handlebars')
const { log } = require('../util/logger')

Handlebars.registerHelper('toJSON', function (json) {
  return new Handlebars.SafeString(JSON.stringify(json))
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
