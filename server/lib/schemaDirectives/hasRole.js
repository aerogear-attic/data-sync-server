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
      // context.request.kauth.grant.access_token.hasRealmRole(role)
      // TODO - figure out how to check does the logged in user have the correct role
      // using the keycloak-connect library
      const result = await resolve.apply(this, [root, args, context, info])
      return result
    }
  }
}

module.exports = HasRoleDirective
