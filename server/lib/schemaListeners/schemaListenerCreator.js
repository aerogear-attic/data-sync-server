const listeners = require('./listeners')

module.exports = function (schemaListenerConfig, onReceive) {
  for (let type of Object.keys(listeners)) {
    if (type === schemaListenerConfig.type) {
      const listener = listeners[type]

      if (listener && typeof listener === 'function') {
        listener(schemaListenerConfig.config, onReceive)
        return // return to end the loop
      } else {
        throw new Error(`Schema listener for ${type} is not a function`)
      }
    }
  }

  throw new Error(`Unhandled schema listener type: ${schemaListenerConfig.type}`)
}
