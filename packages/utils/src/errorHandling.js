import { isFunction } from './base'
import { error } from './log'

export function callWithErrorHandling (fn, instance, info, args) {
  if (!isFunction(fn)) return
  try {
    return args ? fn(...args) : fn()
  } catch (e) {
    error(`Unhandled error occurs${info ? ` during execution of [${info}]` : ''}!`, instance?.options?.mpxFileResource, e)
  }
}

export function wrapMethodsWithErrorHandling (methods, instance) {
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
