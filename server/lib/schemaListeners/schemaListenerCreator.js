const _ = require('lodash')
const listeners = require('./listeners')

module.exports = function (schemaListenerConfig, onReceive) {
  for (let type of Object.keys(listeners)) {
    if (type === schemaListenerConfig.type) {
      const listener = listeners[type]

      if (listener && typeof listener === 'function') {
        // "onReceive" will cause the server to reload the configuration which could be costly.
        // don't allow doing it too often!
        // we debounce the "onReceive" callback here to make sure it is debounced
        // for all listener implementations.
        // that means, the callback will be executed after the system waits until there
        // is no request to call it for N milliseconds.
        // like, when there's an evil client that notifies the listener every 100 ms,
        // we still wait for N ms after the notifications are over
        const debouncedOnReceive = _.debounce(onReceive, 500)
        listener(schemaListenerConfig.config, debouncedOnReceive)
        return // end the loop
      } else {
        throw new Error(`Schema listener for ${type} is not a function`)
      }
    }
  }

  throw new Error(`Unhandled schema listener type: ${schemaListenerConfig.type}`)
}
