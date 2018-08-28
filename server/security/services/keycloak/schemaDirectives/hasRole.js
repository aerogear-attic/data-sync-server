const { SchemaDirectiveVisitor } = require('graphql-tools')
const { defaultFieldResolver } = require('graphql')
const { ForbiddenError } = require('apollo-server-express')
const { log } = require('../../../../lib/util/logger')

class HasRoleDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve = defaultFieldResolver } = field
    const allowedTypes = ['client', 'realm']
    let { role, type } = this.args

    type = type || 'client' // default to client if a type is not specified

    const typeErrorMessage = `type argument in hasRole directive must be one of ${allowedTypes}`
    const permissionErrorMessage = `logged in user does not have sufficient permissions for ${field.name}: missing role ${role}`

    field.resolve = async function (root, args, context, info) {
      if (!allowedTypes.includes(type)) {
        log.info(typeErrorMessage)
        throw new Error(typeErrorMessage)
      }

      if (type === 'realm') {
        if (!context.auth.getToken().hasRealmRole(role)) {
          log.info(permissionErrorMessage)
          throw new ForbiddenError(permissionErrorMessage)
        }
      } else {
        if (!context.auth.getToken().hasRole(role)) {
          log.info(permissionErrorMessage)
          throw new ForbiddenError(permissionErrorMessage)
        }
      }

      // Return appropriate error if this is false
      const result = await resolve.apply(this, [root, args, context, info])
      return result
    }
  }
}

module.exports = HasRoleDirective
