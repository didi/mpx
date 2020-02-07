import {
  isObservableArray,
  isObservableMap,
  isObservable,
  get,
  toJS
} from '../mobx'

import Vue from '../vue'

import _getByPath from './getByPath'

import { error } from './log'

export function type (n) {
  return Object.prototype.toString.call(n).slice(8, -1)
}

export function asyncLock () {
  let lock = false
  return (fn, onerror) => {
    if (!lock) {
      lock = true
      Promise.resolve().then(() => {
        lock = false
        typeof fn === 'function' && fn()
      }).catch(e => {
        lock = false
        error('Something wrong in mpx asyncLock func execution, please check.', undefined, e)
        typeof onerror === 'function' && onerror()
      })
    }
  }
}

export function aliasReplace (options = {}, alias, target) {
  if (options[alias]) {
    const dataType = type(options[alias])
    switch (dataType) {
      case 'Object':
        options[target] = Object.assign({}, options[alias], options[target])
        break
      case 'Array':
        options[target] = options[alias].concat(options[target] || [])
        break
      default:
        options[target] = options[alias]
        break
    }
    delete options[alias]
  }
  return options
}

export function findItem (arr = [], key) {
  for (const item of arr) {
    if ((type(key) === 'RegExp' && key.test(item)) || item === key) {
      return true
    }
  }
  return false
}

export function normalizeMap (prefix, arr) {
  if (typeof prefix !== 'string') {
    arr = prefix
    prefix = ''
  }
  const objType = type(arr)
  if (objType === 'Array') {
    const map = {}
    arr.forEach(value => {
      map[value] = prefix ? `${prefix}.${value}` : value
    })
    return map
  }
  if (prefix && objType === 'Object') {
    arr = Object.assign({}, arr)
    Object.keys(arr).forEach(key => {
      if (typeof arr[key] === 'string') {
        arr[key] = `${prefix}.${arr[key]}`
      }
    })
  }
  return arr
}

export function isExistAttr (obj, attr) {
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

export function setByPath (data, pathStrOrArr, value) {
  let parent
  let variable
  _getByPath(data, pathStrOrArr, (value, key, meta) => {
    if (meta.isEnd) {
      parent = value
      variable = key
    }
    return value[key]
  })
  if (parent && variable) {
    if (__mpx_mode__ === 'web') {
      Vue.set(parent, variable, value)
    } else {
      parent[variable] = value
    }
  }
}

export function getByPath (data, pathStrOrArr, defaultVal = '', errTip) {
  const results = []
  let normalizedArr = []
  if (Array.isArray(pathStrOrArr)) {
    normalizedArr = [pathStrOrArr]
  } else if (type(pathStrOrArr) === 'String') {
    normalizedArr = pathStrOrArr.split(',').map(str => str.trim())
  }

  normalizedArr.forEach(path => {
    if (!path) return
    const result = _getByPath(data, path, (value, key) => {
      let newValue
      if (__mpx_mode__ !== 'web' && isObservable(value)) {
        // key可能不是一个响应式属性，那么get将无法返回正确值
        newValue = get(value, key) || value[key]
      } else if (isExistAttr(value, key)) {
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

export function defineGetterSetter (target, key, getValue, setValue, context) {
  let get
  let set
  if (typeof getValue === 'function') {
    get = context ? getValue.bind(context) : getValue
  } else {
    get = function () {
      return getValue
    }
  }
  if (typeof setValue === 'function') {
    set = context ? setValue.bind(context) : setValue
  }
  let descriptor = {
    get,
    configurable: true,
    enumerable: true
  }
  if (set) descriptor.set = set
  Object.defineProperty(target, key, descriptor)
}

export function proxy (target, source, keys, mapKeys, readonly) {
  if (typeof mapKeys === 'boolean') {
    readonly = mapKeys
    mapKeys = null
  }
  keys.forEach((key, index) => {
    const descriptor = {
      get () {
        return source[key]
      },
      configurable: true,
      enumerable: true
    }
    !readonly && (descriptor.set = function (val) {
      source[key] = val
    })
    Object.defineProperty(target, mapKeys ? mapKeys[index] : key, descriptor)
  })
  return target
}

export function filterProperties (source, props = []) {
  const newData = {}
  props.forEach(prop => {
    if (prop in source) {
      const result = source[prop]
      newData[prop] = __mpx_mode__ !== 'web' && isObservable(result) ? toJS(result) : diffAndCloneA(result).clone
    }
  })
  return newData
}

export function merge (to, from) {
  if (!from) return to
  const keys = Object.keys(from)
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i]
    if (type(from[key]) === 'Object') {
      if (type(to[key]) !== 'Object') {
        to[key] = {}
      }
      merge(to[key], from[key])
    } else {
      to[key] = from[key]
    }
  }
  return to
}

export function enumerableKeys (obj) {
  const keys = []
  for (let key in obj) {
    keys.push(key)
  }
  return keys
}

export function extend (target, ...froms) {
  for (const from of froms) {
    if (type(from) === 'Object') {
      // for in 能遍历原型链上的属性
      for (const key in from) {
        target[key] = from[key]
      }
    }
  }
  return target
}

export function dissolveAttrs (target = {}, keys) {
  if (type(keys) === 'String') {
    keys = [keys]
  }
  const newOptions = extend({}, target)
  keys.forEach(key => {
    const value = target[key]
    if (type(value) !== 'Object') return
    delete newOptions[key]
    extend(newOptions, value)
  })
  return newOptions
}

export function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

export function likeArray (arr) {
  if (__mpx_mode__ === 'web') {
    return Array.isArray(arr)
  } else {
    return Array.isArray(arr) || isObservableArray(arr)
  }
}

export function isDef (v) {
  return v !== undefined && v !== null
}

export function stringifyClass (value) {
  if (likeArray(value)) {
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

export function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

export function hump2dash (value) {
  return value.replace(/[A-Z]/g, function (match) {
    return '-' + match.toLowerCase()
  })
}

export function dash2hump (value) {
  return value.replace(/-([a-z])/g, function (match, p1) {
    return p1.toUpperCase()
  })
}

export function parseStyleText (cssText) {
  const res = {}
  const listDelimiter = /;(?![^(]*\))/g
  const propertyDelimiter = /:(.+)/
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      let tmp = item.split(propertyDelimiter)
      tmp.length > 1 && (res[dash2hump(tmp[0].trim())] = tmp[1].trim())
    }
  })
  return res
}

export function genStyleText (styleObj) {
  let res = ''
  for (let key in styleObj) {
    if (styleObj.hasOwnProperty(key)) {
      let item = styleObj[key]
      res += `${hump2dash(key)}:${item};`
    }
  }
  return res
}

export function mergeObjectArray (arr) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

export function normalizeDynamicStyle (value) {
  if (likeArray(value)) {
    return mergeObjectArray(value)
  }
  if (typeof value === 'string') {
    return parseStyleText(value)
  }
  return value
}

export function isEmptyObject (obj) {
  if (!obj) {
    return true
  }
  for (let key in obj) {
    return false
  }
  return true
}

export function aIsSubPathOfB (a, b) {
  if (a.startsWith(b) && a !== b) {
    let nextChar = a[b.length]
    if (nextChar === '.') {
      return a.slice(b.length + 1)
    } else if (nextChar === '[') {
      return a.slice(b.length)
    }
  }
}

function doMergeData (target, source) {
  Object.keys(source).forEach((srcKey) => {
    if (target.hasOwnProperty(srcKey)) {
      target[srcKey] = source[srcKey]
    } else {
      let processed = false
      const tarKeys = Object.keys(target)
      for (let i = 0; i < tarKeys.length; i++) {
        const tarKey = tarKeys[i]
        if (aIsSubPathOfB(tarKey, srcKey)) {
          delete target[tarKey]
          target[srcKey] = source[srcKey]
          processed = true
          continue
        }
        const subPath = aIsSubPathOfB(srcKey, tarKey)
        if (subPath) {
          setByPath(target[tarKey], subPath, source[srcKey])
          processed = true
          break
        }
      }
      if (!processed) {
        target[srcKey] = source[srcKey]
      }
    }
  })
  return target
}

export function mergeData (target, ...sources) {
  if (target) {
    sources.forEach((source) => {
      if (source) doMergeData(target, source)
    })
  }
  return target
}

export function processUndefined (obj) {
  let result = {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key] !== undefined) {
        result[key] = obj[key]
      } else {
        result[key] = ''
      }
    }
  }
  return result
}

function unwrap (a) {
  if (__mpx_mode__ !== 'web' && isObservableArray(a)) {
    return a.peek()
  }
  if (__mpx_mode__ !== 'web' && isObservableMap(a)) {
    return a.entries()
  }
  return a
}

export function noop () {

}

export function diffAndCloneA (a, b) {
  const diffPaths = []
  const curPath = []
  let diff = false

  function deepDiffAndCloneA (a, b, currentDiff) {
    const setDiff = (val) => {
      if (currentDiff) return
      if (val) {
        currentDiff = val
        if (curPath.length) {
          diffPaths.push(curPath.slice())
        }
      }
    }

    const toString = Object.prototype.toString
    const type = typeof a
    let clone = a

    if (type !== 'object' || a === null) {
      setDiff(a !== b)
    } else {
      a = unwrap(a)
      b = unwrap(b)
      let sameClass = true

      const className = toString.call(a)
      if (className !== toString.call(b)) {
        setDiff(true)
        sameClass = false
      }
      let length
      switch (className) {
        case '[object RegExp]':
        case '[object String]':
          if (sameClass) setDiff('' + a !== '' + b)
          break
        case '[object Number]':
        case '[object Date]':
        case '[object Boolean]':
          if (sameClass) setDiff(+a !== +b)
          break
        case '[object Symbol]':
          if (sameClass) setDiff(a !== b)
          break
        case '[object Array]':
          length = a.length
          if (sameClass && length !== b.length) {
            setDiff(true)
          }
          clone = []
          for (let i = 0; i < length; i++) {
            curPath.push(i)
            clone[i] = deepDiffAndCloneA(a[i], sameClass ? b[i] : undefined, currentDiff)
            curPath.pop()
          }
          break
        default:
          let keys = Object.keys(a)
          let key
          length = keys.length
          if (sameClass && length !== Object.keys(b).length) {
            setDiff(true)
          }
          clone = {}
          for (let i = 0; i < length; i++) {
            key = keys[i]
            curPath.push(key)
            clone[key] = deepDiffAndCloneA(a[key], sameClass ? b[key] : undefined, currentDiff)
            curPath.pop()
          }
      }
    }
    if (currentDiff) {
      diff = currentDiff
    }
    return clone
  }

  let clone = deepDiffAndCloneA(a, b, diff)

  return {
    clone,
    diff,
    diffPaths
  }
}

export function isValidIdentifierStr (str) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str)
}

export function isNumberStr (str) {
  return /^\d+$/.test(str)
}

let datasetReg = /^data-(.+)$/

export function collectDataset (props) {
  let dataset = {}
  for (let key in props) {
    if (props.hasOwnProperty(key)) {
      let matched = datasetReg.exec(key)
      if (matched) {
        dataset[matched[1]] = props[key]
      }
    }
  }
  return dataset
}

/**
 * process renderData, remove sub node if visit parent node already
 * @param {Object} renderData
 * @return {Object} processedRenderData
 */
export function preProcessRenderData (renderData) {
  // method for get key path array
  const processKeyPathMap = (keyPathMap) => {
    let keyPath = Object.keys(keyPathMap)
    return keyPath.filter((keyA) => {
      return keyPath.every((keyB) => {
        if (keyA.startsWith(keyB) && keyA !== keyB) {
          let nextChar = keyA[keyB.length]
          if (nextChar === '.' || nextChar === '[') {
            return false
          }
        }
        return true
      })
    })
  }

  const processedRenderData = {}
  const renderDataFinalKey = processKeyPathMap(renderData)
  Object.keys(renderData).forEach(item => {
    if (renderDataFinalKey.indexOf(item) > -1) {
      processedRenderData[item] = renderData[item]
    }
  })
  return processedRenderData
}
