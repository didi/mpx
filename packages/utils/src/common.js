import EXPORT_MPX from '@mpxjs/core'
import _getByPath from './getByPath'

const noop = () => {}

function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

// type在支付宝环境下不一定准确，判断是普通对象优先使用isPlainObject（新版支付宝不复现，issue #644 修改isPlainObject实现与type等价）
function type (n) {
  return Object.prototype.toString.call(n).slice(8, -1)
}

function isPlainObject (value) {
  if (value === null || typeof value !== 'object' || type(value) !== 'Object') return false
  const proto = Object.getPrototypeOf(value)
  if (proto === null) return true
  // 处理支付宝接口返回数据对象的__proto__与js中创建对象的__proto__不一致的问题，判断value.__proto__.__proto__ === null时也认为是plainObject
  const innerProto = Object.getPrototypeOf(proto)
  if (proto === Object.prototype || innerProto === null) return true
  // issue #644
  const observeClassInstance = EXPORT_MPX.config.observeClassInstance
  if (observeClassInstance) {
    if (Array.isArray(observeClassInstance)) {
      for (let i = 0; i < observeClassInstance.length; i++) {
        if (proto === observeClassInstance[i].prototype) return true
      }
    } else {
      return true
    }
  }
  return false
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

export {
  noop,
  type,
  isObject,
  isPlainObject,
  getByPath,
  normalizeMap
}
