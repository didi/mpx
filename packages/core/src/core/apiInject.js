import { isArray, isFunction, warn } from '@mpxjs/utils'
import { currentInstance } from './proxy'

const globalProvides = Object.create(null)

function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

export const hasSymbol =
  typeof Symbol !== 'undefined' &&
  isNative(Symbol) &&
  typeof Reflect !== 'undefined' &&
  isNative(Reflect.ownKeys)

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

export function provide (key, value) {
  if (key in globalProvides) {
    warn(`provide() key [${key}] already exists, it will be overwritten.`)
  }
  globalProvides[key] = value
}

export function inject (key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance
  if (!instance) {
    warn('inject() can only be used inside setup()')
    return
  }
  if (key in globalProvides) {
    return globalProvides[key]
  } else if (arguments.length > 1) {
    return treatDefaultAsFactory && isFunction(defaultValue)
      ? defaultValue.call(instance && instance.target)
      : defaultValue
  } else {
    warn(`injection "${String(key)}" not found.`)
  }
}
