const log = require('pino')()
const auditLogger = log.child({tag: 'AUDIT'})
const { buildPath } = require('@aerogear/data-sync-gql-core').util.graphqlPathUtil

const auditLogEnabled = process.env.AUDIT_LOGGING !== 'false' && process.env.AUDIT_LOGGING !== false

function getClientInfoFromHeaders (request) {
  if (request && request.headers && request.headers['data-sync-client-info']) {
    const encoded = request.headers['data-sync-client-info']
    let buf
    try {
      buf = Buffer.from(encoded, 'base64')
    } catch (e) {
      const msg = 'Unable decode base64 data-sync-client-info header provided by the client. Message: ' + e.message
      log.error(msg)
      throw new Error(msg)
    }

    const decoded = buf.toString('utf8')
    try {
      return JSON.parse(decoded)
    } catch (e) {
      const msg = 'Unable to parse data-sync-client-info header provided by the client. Message: ' + e.message
      log.error(msg)
      throw new Error(msg)
    }
  }
  return undefined
}

function auditLog (success, context, info, parent, args, msg) {
  if (auditLogEnabled) {
    auditLogger.info({
      audit: {
        msg: msg || '',
        requestId: context ? (context.request ? context.request.id : undefined) : undefined,
        operationType: info.operation.operation,
        fieldName: info.fieldname,
        parentTypeName: info.parentType.name,
        path: buildPath(info.path),
        success: success,
        parent: parent,
        arguments: args,
        dataSourceType: info.dataSourceType || '',
        clientInfo: context ? context.clientInfo : undefined
      }
    })
  }
}

module.exports = {log, getClientInfoFromHeaders, auditLogEnabled, auditLog}
