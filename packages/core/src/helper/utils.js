import {
  isObservableArray
} from 'mobx'

export function type (n) {
  return Object.prototype.toString.call(n).slice(8, -1)
}

export function normalizeMap (arr) {
  if (type(arr) === 'Array') {
    const map = {}
    arr.forEach(value => {
      map[value] = value
    })
    return map
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

export function getByPath (data, pathStr, notExistOutput) {
  if (!pathStr) return data
  const path = pathStr.split('.')
  let notExist = false
  let value = data
  for (let key of path) {
    if (isExistAttr(value, key)) {
      value = value[key]
    } else {
      value = undefined
      notExist = true
      break
    }
  }
  if (notExistOutput) {
    return notExist ? notExistOutput : value
  } else {
    // 小程序setData时不允许undefined数据
    return value === undefined ? '' : value
  }
}

export function enumerable (target, keys) {
  keys.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    if (!descriptor.enumerable) {
      descriptor.enumerable = true
      Object.defineProperty(target, key, descriptor)
    }
  })
  return target
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

export function deleteProperties (source, props = []) {
  if (!props.length) return source
  const sourceKeys = Object.keys(source)
  const newData = {}
  for (let key of sourceKeys) {
    if (props.indexOf(key) < 0) {
      newData[key] = source[key]
    }
  }
  return newData
}

export function merge (to, from) {
  if (!from) return to
  let key, toVal, fromVal
  let keys = Object.keys(from)
  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    toVal = to[key]
    fromVal = from[key]
    if (type(toVal) === 'Object' && type(fromVal) === 'Object') {
      merge(toVal, fromVal)
    } else {
      to[key] = fromVal
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
  return Array.isArray(arr) || isObservableArray(arr)
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

function toJS (source, detectCycles, __alreadySeen) {
  if (detectCycles === void 0) {
    detectCycles = true
  }
  if (__alreadySeen === void 0) {
    __alreadySeen = []
  }
  // optimization: using ES6 map would be more efficient!
  // optimization: lift this function outside toJS, this makes recursion expensive
  function cache (value) {
    if (detectCycles)
      __alreadySeen.push([source, value])
    return value
  }

  if (isObservable(source)) {
    if (detectCycles && __alreadySeen === null)
      __alreadySeen = []
    if (detectCycles && source !== null && typeof source === 'object') {
      for (var i = 0, l = __alreadySeen.length; i < l; i++)
        if (__alreadySeen[i][0] === source)
          return __alreadySeen[i][1]
    }
    if (isObservableArray(source)) {
      var res = cache([])
      var toAdd = source.map(function (value) {
        return toJS(value, detectCycles, __alreadySeen)
      })
      res.length = toAdd.length
      for (var i = 0, l = toAdd.length; i < l; i++)
        res[i] = toAdd[i]
      return res
    }
    if (isObservableObject(source)) {
      var res = cache({})
      for (var key in source)
        res[key] = toJS(source[key], detectCycles, __alreadySeen)
      return res
    }
    if (isObservableMap(source)) {
      var res_1 = cache({})
      source.forEach(function (value, key) {
        return (res_1[key] = toJS(value, detectCycles, __alreadySeen))
      })
      return res_1
    }
    if (isObservableValue(source))
      return toJS(source.get(), detectCycles, __alreadySeen)
  }
  return source
}

function eq (a, b, aStack, bStack) {
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
  if (a === b)
    return a !== 0 || 1 / a === 1 / b
  // `null` or `undefined` only equal to itself (strict comparison).
  if (a == null || b == null)
    return false
  // `NaN`s are equivalent, but non-reflexive.
  if (a !== a)
    return b !== b
  // Exhaust primitive checks
  var type = typeof a
  if (type !== 'function' && type !== 'object' && typeof b != 'object')
    return false
  return deepEq(a, b, aStack, bStack)
}

function unwrap (a) {
  if (isObservableArray(a))
    return a.peek()
  if (isObservableMap(a))
    return a.entries()
  if (isES6Map(a))
    return iteratorToArray(a.entries())
  return a
}

function has (a, key) {
  return Object.prototype.hasOwnProperty.call(a, key)
}

const diffPaths = []
const curPath = []
let diff = false
let seen = []


function deepCloneAndDiff (a, b, parentDiff) {
  let curentDiff = false
  const setDiff = (val) => {
    if (parentDiff) return
    if (val) {
      curentDiff = val
      diffPaths.push(curPath.slice())
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
    const className = toString.call(a)
    if (className !== toString.call(b)) {
      setDiff(true)
    }
    let length
    switch (className) {
      case '[object RegExp]':
      case '[object String]':
        setDiff('' + a !== '' + b)
        break
      case '[object Number]':
      case '[object Date]':
      case '[object Boolean]':
        setDiff(+a !== +b)
        break
      case '[object Symbol]':
        setDiff(a !== b)
        break
      case '[object Array]':
        length = a.length
        if (length !== b.length) {
          setDiff(true)
        } else {
          while (length--) {
            curPath.push(length)
            deepCloneAndDiff(a[length], b[length], curentDiff)
            curPath.pop()
          }
        }
        break
      default:
        let keys = Object.keys(a), key
        length = keys.length
        if (Object.keys(b).length !== length) {
          setDiff(true)
        } else {
          while (length--) {
            key = keys[length]
            if (has(b, key)) {
              curPath.push(key)
              deepCloneAndDiff(a[key], b[key], curentDiff)
              curPath.pop()
            } else {
              setDiff(true)
            }
          }
        }
    }
  }
  if (curentDiff) {
    diff = curentDiff
  }
  return clone
}

// Internal recursive comparison function for `isEqual`.
function deepCompaAndCloneA (a, b, diffPath, clonedA, aStack, bStack) {
  if (a === b)
    return a !== 0 || 1 / a === 1 / b
  // `null` or `undefined` only equal to itself (strict comparison).
  if (a == null || b == null)
    return false
  // `NaN`s are equivalent, but non-reflexive.
  if (a !== a)
    return b !== b
  // Exhaust primitive checks
  var type = typeof a
  if (type !== 'function' && type !== 'object' && typeof b != 'object')
    return false
  // Unwrap any wrapped objects.
  a = unwrap(a)
  b = unwrap(b)
  // Compare `[[Class]]` names.
  var className = toString.call(a)
  if (className !== toString.call(b))
    return false
  switch (className) {
    // Strings, numbers, regular expressions, dates, and booleans are compared by value.
    case '[object RegExp]':
    // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return '' + a === '' + b
    case '[object Number]':
      // `NaN`s are equivalent, but non-reflexive.
      // Object(NaN) is equivalent to NaN.
      if (+a !== +a)
        return +b !== +b
      // An `egal` comparison is performed for other numeric values.
      return +a === 0 ? 1 / +a === 1 / b : +a === +b
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a === +b
    case '[object Symbol]':
      return (typeof Symbol !== 'undefined' && Symbol.valueOf.call(a) === Symbol.valueOf.call(b))
  }
  var areArrays = className === '[object Array]'
  if (!areArrays) {
    if (typeof a != 'object' || typeof b != 'object')
      return false
    // Objects with different constructors are not equivalent, but `Object`s or `Array`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor
    if (aCtor !== bCtor &&
      !(typeof aCtor === 'function' &&
        aCtor instanceof aCtor &&
        typeof bCtor === 'function' &&
        bCtor instanceof bCtor) &&
      ('constructor' in a && 'constructor' in b)) {
      return false
    }
  }
  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
  // Initializing stack of traversed objects.
  // It's done here since we only need them for objects and arrays comparison.
  aStack = aStack || []
  bStack = bStack || []
  var length = aStack.length
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (aStack[length] === a)
      return bStack[length] === b
  }
  // Add the first object to the stack of traversed objects.
  aStack.push(a)
  bStack.push(b)
  // Recursively compare objects and arrays.
  if (areArrays) {
    // Compare array lengths to determine if a deep comparison is necessary.
    length = a.length
    if (length !== b.length)
      return false
    // Deep compare the contents, ignoring non-numeric properties.
    while (length--) {
      if (!eq(a[length], b[length], aStack, bStack))
        return false
    }
  }
  else {
    // Deep compare objects.
    var keys = Object.keys(a), key
    length = keys.length
    // Ensure that both objects contain the same number of properties before comparing deep equality.
    if (Object.keys(b).length !== length)
      return false
    while (length--) {
      // Deep compare each member
      key = keys[length]
      if (!(has(b, key) && eq(a[key], b[key], aStack, bStack)))
        return false
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop()
  bStack.pop()
  return true
}
