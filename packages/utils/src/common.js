import { hasOwn } from './processObj'

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

function isEmptyObject (obj) {
  if (!obj) {
    return true
  }
  /* eslint-disable no-unreachable-loop */
  for (const key in obj) {
    return false
  }
  return true
}

function isNumberStr (str) {
  return /^\d+$/.test(str)
}

function isValidIdentifierStr (str) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str)
}

const hasProto = '__proto__' in {}

function dash2hump (value) {
  return value.replace(/-([a-z])/g, function (match, p1) {
    return p1.toUpperCase()
  })
}

function hump2dash (value) {
  return value.replace(/[A-Z]/g, function (match) {
    return '-' + match.toLowerCase()
  })
}

function processUndefined (obj) {
  const result = {}
  for (const key in obj) {
    if (hasOwn(obj, key)) {
      if (obj[key] !== undefined) {
        result[key] = obj[key]
      } else {
        result[key] = ''
      }
    }
  }
  return result
}

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function defProp (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

// type在支付宝环境下不一定准确，判断是普通对象优先使用isPlainObject（新版支付宝不复现，issue #644 修改isPlainObject实现与type等价）
function type (n) {
  return Object.prototype.toString.call(n).slice(8, -1)
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
  isEmptyObject,
  isNumberStr,
  isValidIdentifierStr,
  normalizeMap,
  aliasReplace,
  stringifyClass,
  hasProto,
  dash2hump,
  hump2dash,
  processUndefined,
  concat,
  defProp
}
