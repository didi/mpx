import { isFunction, type } from './base'
import { getStackByFiberInDevAndProd } from './componentError'

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
  const workInProgress = global.workInProgress
  let stack = ''
  if (workInProgress) {
    stack = getStackByFiberInDevAndProd(workInProgress)
  }
  const errorHandler = mpxGlobal.__mpx?.config.errorHandler
  if (!e) {
    e = new Error(stack ? `${msg}\n Error Component Stack:${stack}` : msg)
  } else {
    if (type(e) === 'Error') {
      if (stack) {
        e.message += `\n Error Component Stack:\n${stack}`
      }
    }
    if (type(e) === 'String') {
      e += `\n Error Component Stack:\n${stack}`
    }
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

    console[type](header + msg)
    if (e) console[type](e)
  }
}
