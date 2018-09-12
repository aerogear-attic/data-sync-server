const Handlebars = require('handlebars')
const { log } = require('../util/logger')
const { VMScript } = require('vm2')

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

function compileTemplate (template) {
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

function compileScript (userCodeFragment) {
  try {
    const code = `(function () {
return function customResolverScript(context) {
  ${userCodeFragment}
  }
})()`
    const script = new VMScript(code).compile()
    return script
  } catch (error) {
    log.error({message: `error compiling javascript`, script: userCodeFragment})
    log.error(error)
    throw (error)
  }
}

module.exports = {
  compileTemplate,
  compileScript
}
