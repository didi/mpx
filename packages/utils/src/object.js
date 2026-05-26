import { type, noop, isObject } from './base'

const hasOwnProperty = Object.prototype.hasOwnProperty

const extend = Object.assign

function hasOwn (obj, key) {
  return isObject(obj) && hasOwnProperty.call(obj, key)
}

function isPlainObject (value) {
  if (value === null || typeof value !== 'object' || type(value) !== 'Object') return false
  const proto = Object.getPrototypeOf(value)
  if (proto === null) return true
  // 处理支付宝接口返回数据对象的__proto__与js中创建对象的__proto__不一致的问题，判断value.__proto__.__proto__ === null时也认为是plainObject
  const innerProto = Object.getPrototypeOf(proto)
  if (proto === Object.prototype || innerProto === null) return true
  // issue #644
  const observeClassInstance = mpxGlobal.__mpx?.config.observeClassInstance
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

function diffAndCloneA (a, b) {
  let diffData = null
  let curPath = ''
  let diff = false

  function deepDiffAndCloneA (a, b, currentDiff, bIsEmpty) {
    const setDiff = (val) => {
      if (val && !currentDiff) {
        currentDiff = val
        if (curPath) {
          diffData = diffData || {}
          diffData[curPath] = clone
        }
      }
    }
    let clone = a
    setDiff(bIsEmpty)
    if (typeof a !== 'object' || a === null) {
      setDiff(a !== b)
    } else {
      const toString = Object.prototype.toString
      const className = toString.call(a)
      const sameClass = className === toString.call(b)
      let length
      let lastPath
      if (isPlainObject(a)) {
        const keys = Object.keys(a)
        length = keys.length
        clone = {}
        setDiff(!sameClass || length < Object.keys(b).length || !Object.keys(b).every((key) => hasOwn(a, key)))
        lastPath = curPath
        for (let i = 0; i < length; i++) {
          const key = keys[i]
          curPath += `.${key}`
          clone[key] = deepDiffAndCloneA(a[key], sameClass ? b[key] : undefined, currentDiff, !(sameClass && hasOwn(b, key)))
          curPath = lastPath
        }
        // 继承原始对象的freeze/seal/preventExtensions操作
        if (Object.isFrozen(a)) {
          Object.freeze(clone)
        } else if (Object.isSealed(a)) {
          Object.seal(clone)
        } else if (!Object.isExtensible(a)) {
          Object.preventExtensions(clone)
        }
      } else if (Array.isArray(a)) {
        length = a.length
        clone = []
        setDiff(!sameClass || length < b.length)
        lastPath = curPath
        for (let i = 0; i < length; i++) {
          curPath += `[${i}]`
          clone[i] = deepDiffAndCloneA(a[i], sameClass ? b[i] : undefined, currentDiff, !(sameClass && i < b.length))
          curPath = lastPath
        }
        // 继承原始数组的freeze/seal/preventExtensions操作
        if (Object.isFrozen(a)) {
          Object.freeze(clone)
        } else if (Object.isSealed(a)) {
          Object.seal(clone)
        } else if (!Object.isExtensible(a)) {
          Object.preventExtensions(clone)
        }
      } else if (a instanceof RegExp) {
        setDiff(!sameClass || '' + a !== '' + b)
      } else if (a instanceof Date) {
        setDiff(!sameClass || +a !== +b)
      } else {
        setDiff(!sameClass || a !== b)
      }
    }
    if (currentDiff) {
      diff = currentDiff
    }
    return clone
  }

  return {
    clone: deepDiffAndCloneA(a, b, diff),
    diff,
    diffData
  }
}

function proxy (target, source, keys, readonly, onConflict) {
  if (!mpxGlobal.__mpx) {
    console.warn('[Mpx utils warn]: Can not find "global.__mpx", "proxy" may encounter some potential problems!')
  }
  keys = keys || Object.keys(source)
  keys.forEach((key) => {
    const descriptor = {
      get () {
        const val = source[key]
        if (mpxGlobal.__mpx) {
          return !mpxGlobal.__mpx.isReactive(source) && mpxGlobal.__mpx.isRef(val) ? val.value : val
        } else {
          return val
        }
      },
      configurable: true,
      enumerable: true
    }
    descriptor.set = readonly
      ? noop
      : function (val) {
        if (mpxGlobal.__mpx) {
          const isRef = mpxGlobal.__mpx.isRef
          // 对reactive对象代理时不需要处理ref解包
          if (!mpxGlobal.__mpx.isReactive(source)) {
            const oldVal = source[key]
            if (isRef(oldVal) && !isRef(val)) {
              oldVal.value = val
              return
            }
          }
        }
        source[key] = val
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

function spreadProp (obj, key) {
  if (hasOwn(obj, key)) {
    const temp = obj[key]
    delete obj[key]
    Object.assign(obj, temp)
  }
  return obj
}

// 包含原型链上属性keys
function enumerableKeys (obj) {
  const keys = []
  for (const key in obj) {
    keys.push(key)
  }
  return keys
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

export {
  hasOwn,
  extend,
  isPlainObject,
  diffAndCloneA,
  proxy,
  spreadProp,
  enumerableKeys,
  processUndefined
}
