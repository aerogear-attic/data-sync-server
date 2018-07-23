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

function compile (template) {
  // use Handlebars.precompile to fail early during initialization
  const noEscape = true
  try {
    Handlebars.precompile(template)
  } catch (ex) {
    log.error('Compilation error in template: ' + template)
    log.error(ex)
    throw (ex)
  }

  return Handlebars.compile(template, { noEscape })
}

module.exports = {
  compile
}
