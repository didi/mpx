import EXPORT_MPX from '../index'
import { error } from './log'
import { isFunction } from './utils'

export function callWithErrorHandling (fn, instance, info, args) {
  if (!isFunction(fn)) return
  try {
    return args ? fn(...args) : fn()
  } catch (e) {
    if (isFunction(EXPORT_MPX.config.errorHandler)) {
      EXPORT_MPX.config.errorHandler(e, instance, info)
    } else {
      error(`Unhandled error occurs${info ? ` during execution of ${info}` : ``}!`, instance?.options?.mpxFileResource, e)
      throw e
    }
  }
}
