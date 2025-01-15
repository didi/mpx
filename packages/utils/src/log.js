import { isFunction } from './base'

const isDev = process.env.NODE_ENV !== 'production'

export function warn (msg, location, e) {
  const condition = global.__mpx?.config.ignoreWarning
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
  if (!ignore) {
    const warnHandler = global.__mpx?.config.warnHandler
    if (isFunction(warnHandler)) {
      warnHandler(msg, location, e)
    } else {
      log('warn', msg, location, e)
    }
  }
}

export function error (msg, location, e) {
  const errorHandler = global.__mpx?.config.errorHandler
  if (isFunction(errorHandler)) {
    errorHandler(msg, location, e)
  } else {
    log('error', msg, location, e)
  }
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
