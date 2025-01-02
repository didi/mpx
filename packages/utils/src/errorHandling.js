import { isFunction, isPromise } from './base'
import { error } from './log'

function handleError (e, instance, info) {
  error(`Unhandled error occurs${info ? ` during execution of [${info}]` : ''}!`, instance?.options.mpxFileResource, e)
}

export function callWithErrorHandling (fn, instance, info, args) {
  if (!isFunction(fn)) return
  try {
    const res = args ? fn(...args) : fn()
    if (res && isPromise(res)) {
      res.catch(e => {
        handleError(e, instance, info)
      })
    }
    return res
  } catch (e) {
    handleError(e, instance, info)
  }
}

export function wrapMethodsWithErrorHandling (methods, instance) {
  // if (process.env.NODE_ENV === 'production') return methods
  const newMethods = {}
  Object.keys(methods).forEach((key) => {
    if (isFunction(methods[key])) {
      newMethods[key] = function (...args) {
        return callWithErrorHandling(methods[key].bind(this), instance || this?.__mpxProxy, `component method ${key}`, args)
      }
    } else {
      newMethods[key] = methods[key]
    }
  })
  return newMethods
}
