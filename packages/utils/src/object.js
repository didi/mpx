import { isRef, isReactive } from '@mpxjs/core'
import { type, noop } from './base'

const hasOwnProperty = Object.prototype.hasOwnProperty

function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

function isPlainObject (value) {
  if (value === null || typeof value !== 'object' || type(value) !== 'Object') return false
  const proto = Object.getPrototypeOf(value)
  if (proto === null) return true
  // 处理支付宝接口返回数据对象的__proto__与js中创建对象的__proto__不一致的问题，判断value.__proto__.__proto__ === null时也认为是plainObject
  const innerProto = Object.getPrototypeOf(proto)
  if (proto === Object.prototype || innerProto === null) return true
  // issue #644
  const observeClassInstance = global.__mpx?.config.observeClassInstance
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

  function deepDiffAndCloneA (a, b, currentDiff) {
    const setDiff = (val) => {
      if (val) {
        currentDiff = val
        if (curPath) {
          diffData = diffData || {}
          diffData[curPath] = clone
        }
      }
    }
    let clone = a
    if (typeof a !== 'object' || a === null) {
      if (!currentDiff) setDiff(a !== b)
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
        if (!currentDiff) setDiff(!sameClass || length < Object.keys(b).length || !Object.keys(b).every((key) => hasOwn(a, key)))
        lastPath = curPath
        for (let i = 0; i < length; i++) {
          const key = keys[i]
          curPath += `.${key}`
          clone[key] = deepDiffAndCloneA(a[key], sameClass ? b[key] : undefined, currentDiff)
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
        if (!currentDiff) setDiff(!sameClass || length < b.length)
        lastPath = curPath
        for (let i = 0; i < length; i++) {
          curPath += `[${i}]`
          clone[i] = deepDiffAndCloneA(a[i], sameClass ? b[i] : undefined, currentDiff)
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
        if (!currentDiff) setDiff(!sameClass || '' + a !== '' + b)
      } else if (a instanceof Date) {
        if (!currentDiff) setDiff(!sameClass || +a !== +b)
      } else {
        if (!currentDiff) setDiff(!sameClass || a !== b)
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
  keys = keys || Object.keys(source)
  keys.forEach((key) => {
    const descriptor = {
      get () {
        const val = source[key]
        return !isReactive(source) && isRef(val) ? val.value : val
      },
      configurable: true,
      enumerable: true
    }
    descriptor.set = readonly
      ? noop
      : function (val) {
        // 对reactive对象代理时不需要处理ref解包
        if (!isReactive(source)) {
          const oldVal = source[key]
          if (isRef(oldVal) && !isRef(val)) {
            oldVal.value = val
            return
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
  isPlainObject,
  diffAndCloneA,
  proxy,
  spreadProp,
  enumerableKeys,
  processUndefined
}
