import EXPORT_MPX from '@mpxjs/core'

const isDev = process.env.NODE_ENV !== 'production'

function isFunction (fn) {
  return typeof fn === 'function'
}

export function warn (msg, location, e) {
  const condition = EXPORT_MPX.config.ignoreWarning
  let ignore = false
  if (typeof condition === 'boolean') {
    ignore = condition
  } else if (typeof condition === 'string') {
    ignore = msg.indexOf(condition) !== -1
  } else if (typeof condition === 'function') {
    ignore = condition(msg, location, e)
  } else if (condition instanceof RegExp) {
    ignore = condition.test(msg)
  }
  if (!ignore) return log('warn', msg, location, e)
}

export function error (msg, location, e) {
  if (isFunction(EXPORT_MPX.config.errorHandler)) {
    EXPORT_MPX.config.errorHandler(msg, location, e)
  }
  return log('error', msg, location, e)
}

function log (type, msg, location, e) {
  if (isDev) {
    let header = `[Mpx runtime ${type}]: `
    if (location) {
      header = `[Mpx runtime ${type} at ${location}]: `
    }
    console[type](header + msg)
    if (e) console[type](e)
  }
}
