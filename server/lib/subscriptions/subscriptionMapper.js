const _ = require('lodash')
const { withFilter } = require('graphql-subscriptions')
const { evalWithContext } = require('../util/filterEvaluator')()
const { log } = require('../util/logger')

module.exports = function mapSubscriptions (subsciptionMappings, pubsub) {
  const resolvers = {}

  _.forEach(subsciptionMappings, (subscriptionMapping) => {
    const subscriptionMappingName = subscriptionMapping.field

    if (_.isEmpty(subscriptionMapping.topic)) {
      throw new Error('Missing topic for subscription mapping: ' + subscriptionMappingName)
    }

    let resolver = {}

    if (subscriptionMapping.filter) {
      resolver = {
        subscribe: withFilter(
          () => pubsub.client.asyncIterator(subscriptionMapping.topic),
          (payload, variables) => {
            try {
              return evalWithContext(subscriptionMapping.filter, { payload, variables })
            } catch (error) {
              log.error('error evaluating subscription filter', error, subscriptionMapping.filter)
              return error
            }
          }
        )
      }
    } else {
      resolver = {
        subscribe: () => {
          return pubsub.client.asyncIterator(subscriptionMapping.topic)
        }
      }
    }

    resolvers[subscriptionMapping.type] = resolvers[subscriptionMapping.type] || {}
    resolvers[subscriptionMapping.type][subscriptionMappingName] = resolver
  })
  return resolvers
}
