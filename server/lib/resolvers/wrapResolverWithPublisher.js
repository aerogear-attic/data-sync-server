const { compile } = require('./compiler')
const { log } = require('../util/logger')
const JSONParse = require('json-parse-safe')

exports.wrapResolverWithPublish = function wrapResolverWithPublish (resolver, resolverMapping, pubsub) {
  const publisherConfig = JSONParse(resolverMapping.publish)

  if (publisherConfig.error) {
    // If resolverMapping.publish is a regular (non-JSON) string, then we build a default publisher
    return wrapResolverWithDefaultPublish(resolver, resolverMapping, pubsub)
  }

  resolverMapping.publish = publisherConfig.value
  return wrapResolverWithCustomPublish(resolver, resolverMapping, pubsub)
}

function wrapResolverWithDefaultPublish (resolver, resolverMapping, pubsub) {
  function getDefaultPayload (operationName) {
    return `{ "${operationName}": {{ toJSON context.result }} }`
  }

  const topic = resolverMapping.publish
  const compiledPayload = compile(getDefaultPayload(topic))

  const publishOpts = {
    topic,
    compiledPayload
  }

  return resolveAndPublish(resolver, pubsub, publishOpts)
}

// Build a custom publisher. This is used when a resolverMapping has a publish config object
// This object lets a user define how their payload looks and which topic to publish on
function wrapResolverWithCustomPublish (resolver, resolverMapping, pubsub) {
  const { topic, payload } = resolverMapping.publish

  if (!topic) {
    throw Error(`publish object in resolver mapping ${resolverMapping.field} is missing 'topic' field`)
  }

  if (!payload) {
    throw Error(`publish object in resolver mapping ${resolverMapping.field} is missing 'payload' field`)
  }

  const publishOpts = {
    topic,
    compiledPayload: compile(payload)
  }
  return resolveAndPublish(resolver, pubsub, publishOpts)
}

function resolveAndPublish (resolverFn, pubsub, publishOpts) {
  return (obj, args, context, info) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await resolverFn(obj, args, context, info)
        resolve(result)

        const publishContext = {
          context: {
            result: result
          }
        }

        pubsub.publish(publishOpts, publishContext)
      } catch (error) {
        log.error(error)
        reject(error)
      }
    })
  }
}
