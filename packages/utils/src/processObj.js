import EXPORT_MPX from '@mpxjs/core'
import { type } from './common'

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

export {
  hasOwn,
  isPlainObject,
  diffAndCloneA
}
