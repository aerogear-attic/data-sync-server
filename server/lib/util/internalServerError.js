const { ApolloError } = require('apollo-server-express')
const uuid = require('uuid')

const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'

function newInternalServerError (context) {
  let errorId = (context && context.request) ? context.request.id : uuid.v4()
  const genericErrorMsg = `An internal server error occurred, please contact the server administrator and provide the following id: ${errorId}`
  return new ApolloError(genericErrorMsg, INTERNAL_SERVER_ERROR, { id: errorId })
}

module.exports = newInternalServerError
