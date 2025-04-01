import { isFunction } from './base'
import { error } from './log'

function handleError (e, instance, info) {
  error(`Unhandled error occurs${info ? ` during execution of [${info}]` : ''}!`, instance?.options.mpxFileResource, e)
}

export function callWithErrorHandling (fn, instance, info, args) {
  if (!isFunction(fn)) return
  try {
    return args ? fn(...args) : fn()
  } catch (e) {
    handleError(e, instance, info)
  }
}

export function wrapMethodsWithErrorHandling (methods, instance) {
  // if (process.env.NODE_ENV === 'production') return methods
  const newMethods = {}
  Object.keys(methods).forEach((key) => {
    // worklet 函数重新赋值会变成普通函数，这里只处理非worklet函数
    // 微信小程序&RN worklet都有数值类型的 __workletHash
    if (isFunction(methods[key]) && !methods[key].__workletHash) {
      newMethods[key] = function (...args) {
        return callWithErrorHandling(methods[key].bind(this), instance || this?.__mpxProxy, `component method ${key}`, args)
      }
    } else {
      newMethods[key] = methods[key]
    }
  })
  return newMethods
}
