import { set } from '@mpxjs/core'
import { doGetByPath } from './getByPath'

const noop = () => {}

function isString (str) {
  return typeof str === 'string'
}

function isBoolean (bool) {
  return typeof bool === 'boolean'
}

function isNumber (num) {
  return typeof num === 'number'
}

function isArray (arr) {
  return Array.isArray(arr)
}

function isFunction (fn) {
  return typeof fn === 'function'
}

function isDef (v) {
  return v !== undefined && v !== null
}

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

// type在支付宝环境下不一定准确，判断是普通对象优先使用isPlainObject（新版支付宝不复现，issue #644 修改isPlainObject实现与type等价）
function type (n) {
  return Object.prototype.toString.call(n).slice(8, -1)
}

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

function getByPath (data, pathStrOrArr, defaultVal, errTip) {
  const results = []
  let normalizedArr = []
  if (Array.isArray(pathStrOrArr)) {
    normalizedArr = [pathStrOrArr]
  } else if (typeof pathStrOrArr === 'string') {
    normalizedArr = pathStrOrArr.split(',').map(str => str.trim())
  }

  normalizedArr.forEach(path => {
    if (!path) return
    const result = doGetByPath(data, path, (value, key) => {
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

function setByPath (data, pathStrOrArr, value) {
  doGetByPath(data, pathStrOrArr, (current, key, meta) => {
    if (meta.isEnd) {
      set(current, key, value)
    } else if (!current[key]) {
      current[key] = {}
    }
    return current[key]
  })
}

function normalizeMap (prefix, arr) {
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

function aliasReplace (options = {}, alias, target) {
  if (options[alias]) {
    if (Array.isArray(options[alias])) {
      options[target] = options[alias].concat(options[target] || [])
    } else if (isObject(options[alias])) {
      options[target] = Object.assign({}, options[alias], options[target])
    } else {
      options[target] = options[alias]
    }
    delete options[alias]
  }
  return options
}

function stringifyObject (value) {
  let res = ''
  for (const key in value) {
    if (value[key]) {
      if (res) res += ' '
      res += key
    }
  }
  return res
}

function stringifyArray (value) {
  let res = ''
  let stringified
  for (let i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) res += ' '
      res += stringified
    }
  }
  return res
}

function stringifyClass (value) {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  return ''
}

export {
  noop,
  isString,
  isBoolean,
  isNumber,
  isArray,
  type,
  isDef,
  isFunction,
  isObject,
  getByPath,
  setByPath,
  normalizeMap,
  aliasReplace,
  stringifyClass
}
