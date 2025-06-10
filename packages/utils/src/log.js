import { isFunction } from './base'
import { isReact } from './env'

const isDev = process.env.NODE_ENV !== 'production'

export function warn (msg, location, e) {
  const condition = mpxGlobal.__mpx?.config.ignoreWarning
  if (isDev && !e) {
    e = new Error('Mpx runtime warn')
  }
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
    const warnHandler = mpxGlobal.__mpx?.config.warnHandler
    if (isFunction(warnHandler)) {
      warnHandler(msg, location, e)
    } else {
      log('warn', msg, location, e)
    }
  }
}

export function error (msg, location, e) {
  const errorHandler = mpxGlobal.__mpx?.config.errorHandler
  if (isDev && !e) {
    e = new Error('Mpx runtime error')
  }
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

    const doLog = () => {
      console[type](header + msg)
      if (e) console[type](e)
    }

    if (isReact) {
      setTimeout(doLog, 0)
    } else {
      doLog()
    }
  }
}
