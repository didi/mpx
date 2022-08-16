import { isRef } from '@mpxjs/core'
import _getByPath from './getByPath'

function isExistAttr (obj, attr) {
  const type = typeof obj
  const isNullOrUndefined = obj === null || obj === undefined
  if (isNullOrUndefined) {
    return false
  } else if (type === 'object' || type === 'function') {
    return attr in obj
  } else {
    return obj[attr] !== undefined
  }
}

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

export function getByPath (data, pathStrOrArr, defaultVal, errTip) {
  const results = []
  let normalizedArr = []
  if (Array.isArray(pathStrOrArr)) {
    normalizedArr = [pathStrOrArr]
  } else if (typeof pathStrOrArr === 'string') {
    normalizedArr = pathStrOrArr.split(',').map(str => str.trim())
  }

  normalizedArr.forEach(path => {
    if (!path) return
    const result = _getByPath(data, path, (value, key) => {
      let newValue
      if (isExistAttr(value, key)) {
        newValue = value[key]
      } else {
        newValue = errTip
      }
      return newValue
    })
    // 小程序setData时不允许undefined数据
    results.push(result === undefined ? defaultVal : result)
  })
  return results.length > 1 ? results : results[0]
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