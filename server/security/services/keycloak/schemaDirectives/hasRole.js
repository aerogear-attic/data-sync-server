const { SchemaDirectiveVisitor } = require('graphql-tools')
const { defaultFieldResolver } = require('graphql')
const { ForbiddenError } = require('apollo-server-express')
const newInternalServerError = require('../../../../lib/util/internalServerError')
const Joi = require('joi')
const { log } = require('../../../../lib/util/logger')

class HasRoleDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve = defaultFieldResolver } = field
    const { error, value } = this.validateArgs()

    const { roles } = value

    field.resolve = async function (root, args, context, info) {
      // must check for a validation error at runtime
      // to ensure an appropriate message is sent back
      log.info(`checking user is authorized to access ${field.name} on parent ${info.parentType.name}. Must have one of [${roles}]`)

      if (error) {
        log.error(`Invalid hasRole directive on field ${field.name} on parent ${info.parentType.name}`, error)
        throw newInternalServerError(context)
      }

      const token = context.auth.getToken()
      let foundRole = null // this will be the role the user was successfully authorized on

      foundRole = roles.find((role) => {
        return token.hasRole(role)
      })

      if (!foundRole) {
        const AuthorizationErrorMessage = `user is not authorized for field ${field.name} on parent ${info.parentType.name}. Must have one of the following roles: [${roles}]`
        log.error({ error: AuthorizationErrorMessage, details: token.content })
        throw new ForbiddenError(AuthorizationErrorMessage)
      }

      log.info(`user successfully authorized with role: ${foundRole}`)

      // Return appropriate error if this is false
      const result = await resolve.apply(this, [root, args, context, info])
      return result
    }
  }

  validateArgs () {
    // joi is dope. Read the docs and discover the magic.
    // https://github.com/hapijs/joi/blob/master/API.md
    const argsSchema = Joi.object({
      role: Joi.array().required().items(Joi.string()).single()
    })

    const result = argsSchema.validate(this.args)

    // result.value.role will be an array so it makes sense to add the roles alias
    result.value.roles = result.value.role
    return result
  }
}

module.exports = HasRoleDirective
