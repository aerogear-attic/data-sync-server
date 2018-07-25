const { compile } = require('./compiler')
const { log } = require('../util/logger')

exports.wrapResolverWithPublish = function wrapResolverWithPublish (resolver, resolverMapping, pubsub) {
  try {
    // If resolverMapping.publish is an object then parse it and build a custom publisher
    resolverMapping.publish = JSON.parse(resolverMapping.publish)
    return wrapResolverWithCustomPublish(resolver, resolverMapping, pubsub)
  } catch (error) {
    // If resolverMapping.publish is a string, then we build a default publisher
    return wrapResolverWithDefaultPublish(resolver, resolverMapping, pubsub)
  }
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
