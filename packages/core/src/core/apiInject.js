/**
 * TODO 待确认
 * - [ ] provide/inject API 导出放在何处
 * - [ ] 有必要考虑 key 为 Symbol 的情况吗？这里通过 hasSymbol 判断环境是否支持 Symbol，hasSymbol 通用判断挪到 utils?
 */

import { isArray, isFunction, warn } from '@mpxjs/utils'
import { currentInstance } from '../core/proxy'

function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

export const hasSymbol =
  typeof Symbol !== 'undefined' &&
  isNative(Symbol) &&
  typeof Reflect !== 'undefined' &&
  isNative(Reflect.ownKeys)

export function provide (key, value) {
  const instance = currentInstance
  if (!instance) {
    warn('provide() can only be used inside setup().')
  }
  let provides = instance.provides
  // 默认情况下，一个实例继承其父实例的 `provides` 对象
  // 但是当它需要提供自己的值时，它会使用父实例的 `provides` 作为原型创建自己的 `provides` 对象
  // 这样，在 `inject` 中，我们可以简单地从直接的父实例的 `provides` 中查找注入，并让原型链完成工作
  const parentProvides = instance.parent && instance.parent.provides
  if (provides === parentProvides) {
    provides = instance.provides = Object.create(parentProvides)
  }
  provides[key] = value
}

export function inject (key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance
  if (!instance) {
    warn('inject() can only be used inside setup()')
  }
  const provides = instance.parent && instance.parent.provides
  if (provides && key in provides) {
    return provides[key]
  } else if (arguments.length > 1) {
    return treatDefaultAsFactory && isFunction(defaultValue)
      ? defaultValue.call(instance)
      : defaultValue
  } else {
    warn(`injection "${String(key)}" not found.`)
  }
}

export function normalizeInject (raw) {
  if (isArray(raw)) {
    const res = {}
    for (let i = 0; i < raw.length; i++) {
      res[raw[i]] = raw[i]
    }
    return res
  }
  return raw
}
