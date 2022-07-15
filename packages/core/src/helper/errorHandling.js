import { error } from './log'
import { isFunction } from './utils'

export function callWithErrorHandling (fn, instance, info, args) {
  if (!isFunction(fn)) return
  try {
    return args ? fn(...args) : fn()
  } catch (e) {
    error(`Unhandled error occurs${info ? ` during execution of ${info}` : ``}!`, instance?.options?.mpxFileResource, e)
  }
}
