import EXPORT_MPX, {
  isRef,
  isReactive
} from '@mpxjs/core'

let activePinia

const setActivePinia = (pinia) => (activePinia = pinia)

const getActivePinia = () => {
  return activePinia
}

function isComputed (obj) {
  return !!(isRef(obj) && (obj).effect)
}

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
  if (EXPORT_MPX.config.observeClassInstance) {
    if (Array.isArray(EXPORT_MPX.config.observeClassInstance)) {
      for (let i = 0; i < EXPORT_MPX.config.observeClassInstance.length; i++) {
        if (proto === EXPORT_MPX.config.observeClassInstance[i].prototype) return true
      }
    } else {
      return true
    }
  }
  return false
}

function mergeReactiveObjects (target, patchToApply) {
  for (const key in patchToApply) {
    if (!patchToApply.hasOwnProperty(key)) continue
    const subPatch = patchToApply[key]
    const targetValue = target[key]
    if (isPlainObject(targetValue) &&
      isPlainObject(subPatch) &&
      target.hasOwnProperty(key) &&
      !isRef(subPatch) &&
      !isReactive(subPatch)) {
      target[key] = mergeReactiveObjects(targetValue, subPatch)
    } else {
      target[key] = subPatch
    }
  }
  return target
}

export {
  activePinia,
  getActivePinia,
  setActivePinia,
  mergeReactiveObjects,
  isComputed
}
