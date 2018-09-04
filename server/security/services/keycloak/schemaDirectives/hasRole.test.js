const { test } = require('ava')
const HasRoleDirective = require('./hasRole')

test('context.auth.hasRole is called', async (t) => {
  t.plan(3)
  const directiveArgs = {
    role: 'admin'
  }

  const directive = new HasRoleDirective({
    name: 'testHasRoleDirective',
    args: directiveArgs
  })

  const field = {
    resolve: (root, args, context, info) => {
      t.pass()
    }
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const context = {
    auth: {
      getToken: () => {
        return {
          hasRole: (role) => {
            t.pass()
            t.deepEqual(role, directiveArgs.role)
            return true
          }
        }
      }
    }
  }
  const info = {}

  await field.resolve(root, args, context, info)
})

test('visitFieldDefinition accepts an array of roles', async (t) => {
  t.plan(4)
  const directiveArgs = {
    role: ['foo', 'bar', 'baz']
  }

  const directive = new HasRoleDirective({
    name: 'testHasRoleDirective',
    args: directiveArgs
  })

  const field = {
    resolve: (root, args, context, info) => {
      t.pass()
    }
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const context = {
    auth: {
      getToken: () => {
        return {
          hasRole: (role) => {
            t.log(`checking has role ${role}`)
            t.pass()
            return (role === 'baz') // this makes sure it doesn't return true instantly
          }
        }
      }
    }
  }
  const info = {}

  await field.resolve(root, args, context, info)
})

test('if context.auth.getToken.hasRole() is false, then an error is returned and the original resolver will not execute', async (t) => {
  const directiveArgs = {
    role: 'admin'
  }

  const directive = new HasRoleDirective({
    name: 'testHasRoleDirective',
    args: directiveArgs
  })

  const field = {
    resolve: (root, args, context, info) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called when an auth error is thrown')
        return reject(new Error('the original resolver should never be called when an auth error is thrown'))
      })
    },
    name: 'testField'
  }

  directive.visitFieldDefinition(field)

  const root = {}
  const args = {}
  const context = {
    auth: {
      getToken: () => {
        return {
          hasRole: (role) => {
            t.deepEqual(role, directiveArgs.role)
            return false
          }
        }
      }
    }
  }
  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await t.throws(async () => {
    await field.resolve(root, args, context, info)
  }, `user is not authorized for field ${field.name} on parent ${info.parentType.name}. Must have one of the following roles: [${directiveArgs.role}]`)
})

test('if hasRole arguments are invalid, visitSchemaDirective does not throw, but field.resolve will return a generic error to the user and original resolver will not be called', async (t) => {
  const directiveArgs = {
    role: 'admin',
    some: 'unknown arg'
  }

  const directive = new HasRoleDirective({
    name: 'testHasRoleDirective',
    args: directiveArgs
  })

  const field = {
    resolve: (root, args, context, info) => {
      return new Promise((resolve, reject) => {
        t.fail('the original resolver should never be called when an auth error is thrown')
        return reject(new Error('the original resolver should never be called when an auth error is thrown'))
      })
    },
    name: 'testField'
  }

  t.notThrows(() => {
    directive.visitFieldDefinition(field)
  })

  const root = {}
  const args = {}
  const context = {
    auth: {
      getToken: () => {
        return {
          hasRole: (role) => {
            t.deepEqual(role, directiveArgs.role)
            return false
          }
        }
      }
    },
    request: {
      id: '123'
    }
  }
  const info = {
    parentType: {
      name: 'testParent'
    }
  }

  await t.throws(async () => {
    await field.resolve(root, args, context, info)
  }, `An internal server error occurred, please contact the server administrator and provide the following id: ${context.request.id}`)
})
