const { test } = require('ava')
const newInternalServerError = require('./internalServerError')

const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

test('new internal server error returns a generic error with context.request.id', (t) => {
  const context = {
    request: {
      id: '123'
    }
  }
  const error = newInternalServerError(context)

  t.deepEqual(error.id, context.request.id)
  t.deepEqual(error.extensions.code, INTERNAL_SERVER_ERROR)
  t.deepEqual(error.message, `An internal server error occurred, please contact the server administrator and provide the following id: ${context.request.id}`)
})

test('new internal server error returns a generic error with a uuid when no context is available', (t) => {
  const error = newInternalServerError()

  t.truthy(error.id)
  t.regex(error.id, uuidRegex)
  t.deepEqual(error.extensions.code, INTERNAL_SERVER_ERROR)
})
