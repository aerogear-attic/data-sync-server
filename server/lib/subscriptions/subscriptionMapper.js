const _ = require('lodash')
const { withFilter } = require('graphql-subscriptions')
const { evalWithContext } = require('../util/filterEvaluator')()
const { log } = require('../util/logger')

// This lib is very similar to the resolverMapper.js file
// It takes a list of subscription config objects and builds them into
// resolver functions. We do it separately for subscriptions because their resolver
// functions are a little different than the ones used for regular queries and mutations
module.exports = function mapSubscriptions (subsciptionMappings, pubsub) {
  const resolvers = {}

  _.forEach(subsciptionMappings, (subscriptionMapping) => {
    const subscriptionMappingName = subscriptionMapping.field

    if (_.isEmpty(subscriptionMapping.topic)) {
      subscriptionMapping.topic = subscriptionMappingName
    }

    if (subscriptionMapping.type !== 'Subscription') {
      throw Error(`subscriptionMapping ${subscriptionMappingName} has incorrect type. It must be 'Subscription'`)
    }

    let resolver = {}

    // If the subscriptionMapping config object has a filter config
    // The resolver needs to be built a little differently.
    if (subscriptionMapping.filter) {
      resolver = {
        subscribe: withFilter(
          () => pubsub.getAsyncIterator(subscriptionMapping.topic),
          (payload, variables) => {
            try {
              // evaluate the filter DSL in the context of { payload, variables }
              // This returns true/false. true results in a payload being published
              // to connected clients over websockets
              let { filter } = subscriptionMapping
              log.info('Evaluating Subscription filter', { filter, payload, variables })
              return evalWithContext(filter, { payload, variables })
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
          return pubsub.getAsyncIterator(subscriptionMapping.topic)
        }
      }
    }

    resolvers[subscriptionMapping.type] = resolvers[subscriptionMapping.type] || {}
    resolvers[subscriptionMapping.type][subscriptionMappingName] = resolver
  })
  return resolvers
}
