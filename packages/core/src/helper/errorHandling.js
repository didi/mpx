import EXPORT_MPX from '../index'
import { error } from './log'

export function callWithErrorHandling (fn, instance, info, args) {
  if (typeof fn !== 'function') return
  try {
    return fn.apply(instance.target, args)
  } catch (e) {
    if (typeof EXPORT_MPX.config.errorHandler === 'function') {
      EXPORT_MPX.config.errorHandler(e, instance, info)
    } else {
      error(`Unhandled error occurs${info ? ` during execution of ${info}` : ``}!`, instance.options.mpxFileResource, e)
      throw e
    }
  }
}
