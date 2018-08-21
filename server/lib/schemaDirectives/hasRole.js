const { SchemaDirectiveVisitor } = require('graphql-tools')
const { defaultFieldResolver } = require('graphql')
const { log } = require('../util/logger')

class HasRoleDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve = defaultFieldResolver } = field
    const { role } = this.args
    field.resolve = async function (root, args, context, info) {
      log.info('checking has role directive', role)
      log.info('Printing user', context.request.session)
      // TODO if (context.request.kauth.grant.access_token.hasRealmRole(role))
      // Return appropriate error if this is false
      const result = await resolve.apply(this, [root, args, context, info])
      return result
    }
  }
}

module.exports = HasRoleDirective
