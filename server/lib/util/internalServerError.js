const { ApolloError } = require('apollo-server-express')
const uuid = require('uuid')

const code = 'INTERNAL_SERVER_ERROR'

function newInternalServerError (context) {
  let errorId = (context && context.request) ? context.request.id : uuid.v4()
  const genericErrorMsg = `An internal server error occurred, please contact the server administrator and provide the following id: ${errorId}`
  return new ApolloError(genericErrorMsg, code, { errorId })
}

module.exports = newInternalServerError
