const listeners = require('./listeners')

module.exports = function (schemaListenerConfig) {
  const ListenerClass = listeners[schemaListenerConfig.type]

  if (!ListenerClass) {
    throw new Error(`Unhandled schema listener type: ${schemaListenerConfig.type}`)
  }

  if (typeof ListenerClass !== 'function') {
    throw new Error(`Schema listener for ${schemaListenerConfig.type} is missing a constructor`)
  }

  const listener = new ListenerClass(schemaListenerConfig.config)

  if (!listener.start && typeof listener.start !== 'function') {
    throw new Error(`Schema listener for ${schemaListenerConfig.type} is missing "start" function`)
  }

  if (!listener.stop && typeof listener.stop !== 'function') {
    throw new Error(`Schema listener for ${schemaListenerConfig.type} is missing "stop" function`)
  }

  return listener
}
