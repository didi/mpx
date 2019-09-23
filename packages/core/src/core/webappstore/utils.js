import _getByPath from './getByPath'

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
        console.error(e)
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

export function setByPath (data, pathStr, value) {
  let parent
  let variable
  _getByPath(data, pathStr, (value, key, end) => {
    if (end) {
      parent = value
      variable = key
    }
    return value[key]
  })
  if (parent) {
    parent[variable] = value
  }
}

export function getByPath (data, pathStr, defaultVal = '', errTip) {
  const results = []
  pathStr.split(',').forEach(item => {
    const path = item.trim()
    if (!path) return
    const result = _getByPath(data, path, (value, key) => {
      let newValue
      // if (isObservable(value)) {
      //   // key可能不是一个响应式属性，那么get将无法返回正确值
      //   newValue = get(value, key) || value[key]
      // }
      if (value && isObject(value)) {
        newValue = value[key]
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

export function isDef (v) {
  return v !== undefined && v !== null
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

export function isEmptyObject (obj) {
  if (!obj) {
    return true
  }
  for (let key in obj) {
    return false
  }
  return true
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

export function noop () {

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
export function preprocessRenderData (renderData) {
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
