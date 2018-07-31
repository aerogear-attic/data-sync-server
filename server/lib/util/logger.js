const log = require('pino')()
const auditLogger = log.child({tag: 'AUDIT'})

function auditLog (success, request, info, parent, args, msg) {
  auditLogger.info({
    msg: msg || '',
    requestId: request.id,
    operationType: info.operation.operation,
    fieldName: info.fieldname,
    parentTypeName: info.parentType.name,
    path: buildPath(info.path),
    success: success,
    parent: parent,
    arguments: args
  })
}

// builds path for a GraphQL operation
function buildPath (path) {
  let pathItems = []
  let currPath = path
  while (currPath) {
    pathItems.unshift(currPath.key) // prepend
    currPath = currPath.prev
  }

  return pathItems.join('.')
}

module.exports = {log, auditLog}
