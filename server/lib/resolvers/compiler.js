const Handlebars = require('handlebars')

Handlebars.registerHelper('toJSON', function (json) {
  return new Handlebars.SafeString(JSON.stringify(json))
})

function compileMappings (requestMapping, responseMapping) {
  // use Handlebars.precompile to fail early during initialization
  try {
    Handlebars.precompile(requestMapping)
  } catch (ex) {
    console.error('Compilation error in requestMapping: ' + requestMapping)
    console.error(ex)
    throw new Error('Compilation error in requestMapping: ' + requestMapping)
  }

  try {
    Handlebars.precompile(responseMapping)
  } catch (ex) {
    console.error('Compilation error in response mapping: ' + responseMapping)
    console.error(ex)
    throw new Error('Compilation error in response mapping: ' + responseMapping)
  }

  const compiledRequestMapping = Handlebars.compile(requestMapping)
  const compiledResponseMapping = Handlebars.compile(responseMapping)

  return { compiledRequestMapping, compiledResponseMapping }
}

module.exports = {
  compileMappings
}
