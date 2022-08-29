import { isRef } from '@mpxjs/core'
import { noop, isObject } from '@mpxjs/utils'

export function proxy (target, source, keys, readonly, onConflict) {
  keys = keys || Object.keys(source)
  keys.forEach((key) => {
    const descriptor = {
      get () {
        const val = source[key]
        return isRef(val) ? val.value : val
      },
      configurable: true,
      enumerable: true
    }
    descriptor.set = readonly ? noop : function (val) {
      const oldVal = source[key]
      if (isRef(oldVal) && !isRef(val)) {
        oldVal.value = val
      } else {
        source[key] = val
      }
    }
    if (onConflict) {
      if (key in target) {
        if (onConflict(key) === false) return
      }
    }
    Object.defineProperty(target, key, descriptor)
  })
  return target
}

export function normalizeMap (prefix, arr) {
  if (typeof prefix !== 'string') {
    arr = prefix
    prefix = ''
  }
  if (Array.isArray(arr)) {
    const map = {}
    arr.forEach(value => {
      map[value] = prefix ? `${prefix}.${value}` : value
    })
    return map
  }
  if (prefix && isObject(arr)) {
    arr = Object.assign({}, arr)
    Object.keys(arr).forEach(key => {
      if (typeof arr[key] === 'string') {
        arr[key] = `${prefix}.${arr[key]}`
      }
    })
  }
  return arr
}
