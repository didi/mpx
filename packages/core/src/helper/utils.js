import {
  isObject,
  setByPath,
  hasOwn
} from '@mpxjs/utils'

// 包含原型链上属性keys
export function enumerableKeys (obj) {
  const keys = []
  for (const key in obj) {
    keys.push(key)
  }
  return keys
}

// deepMerge 用于合并i18n语言集
export function merge (target, ...sources) {
  if (isObject(target)) {
    for (const source of sources) {
      if (isObject(source)) {
        Object.keys(source).forEach((key) => {
          if (isObject(source[key]) && isObject(target[key])) {
            merge(target[key], source[key])
          } else {
            target[key] = source[key]
          }
        })
      }
    }
  }
  return target
}

export const hasProto = '__proto__' in {}

// 微信小程序插件环境2.8.3以下基础库protoAugment会失败，对环境进行测试按需降级为copyAugment
function testArrayProtoAugment () {
  const arr = []
  /* eslint-disable no-proto, camelcase */
  arr.__proto__ = { __array_proto_test__: '__array_proto_test__' }
  return arr.__array_proto_test__ === '__array_proto_test__'
}

export const arrayProtoAugment = testArrayProtoAugment()

export function isValidArrayIndex (val) {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

export function remove (arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

export function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
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
      const tmp = item.split(propertyDelimiter)
      tmp.length > 1 && (res[dash2hump(tmp[0].trim())] = tmp[1].trim())
    }
  })
  return res
}

export function genStyleText (styleObj) {
  let res = ''
  for (const key in styleObj) {
    if (hasOwn(styleObj, key)) {
      const item = styleObj[key]
      res += `${hump2dash(key)}:${item};`
    }
  }
  return res
}

export function mergeObjectArray (arr) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      Object.assign(res, arr[i])
    }
  }
  return res
}

export function normalizeDynamicStyle (value) {
  if (Array.isArray(value)) {
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
  /* eslint-disable no-unreachable-loop */
  for (const key in obj) {
    return false
  }
  return true
}

export function aIsSubPathOfB (a, b) {
  if (a.startsWith(b) && a !== b) {
    const nextChar = a[b.length]
    if (nextChar === '.') {
      return a.slice(b.length + 1)
    } else if (nextChar === '[') {
      return a.slice(b.length)
    }
  }
}

export function getFirstKey (path) {
  return /^[^[.]*/.exec(path)[0]
}

function doMergeData (target, source) {
  Object.keys(source).forEach((srcKey) => {
    if (hasOwn(target, srcKey)) {
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

export function isValidIdentifierStr (str) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str)
}

export function isNumberStr (str) {
  return /^\d+$/.test(str)
}

const datasetReg = /^data-(.+)$/

export function collectDataset (props) {
  const dataset = {}
  for (const key in props) {
    if (hasOwn(props, key)) {
      const matched = datasetReg.exec(key)
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
    const keyPath = Object.keys(keyPathMap)
    return keyPath.filter((keyA) => {
      return keyPath.every((keyB) => {
        if (keyA.startsWith(keyB) && keyA !== keyB) {
          const nextChar = keyA[keyB.length]
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

export function spreadProp (obj, key) {
  if (hasOwn(obj, key)) {
    const temp = obj[key]
    delete obj[key]
    Object.assign(obj, temp)
  }
  return obj
}
