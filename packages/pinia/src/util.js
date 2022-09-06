import { isRef, isReactive } from '@mpxjs/core'
import { isPlainObject } from '@mpxjs/utils'

let activePinia

const setActivePinia = (pinia) => (activePinia = pinia)

const getActivePinia = () => {
  return activePinia
}

function isComputed (obj) {
  return !!(isRef(obj) && (obj).effect)
}

function mergeReactiveObjects (target, patchToApply) {
  for (const key in patchToApply) {
    if (!Object.prototype.hasOwnProperty.call(patchToApply, key)) continue
    const subPatch = patchToApply[key]
    const targetValue = target[key]
    if (isPlainObject(targetValue) &&
      isPlainObject(subPatch) &&
      Object.prototype.hasOwnProperty.call(target, key) &&
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
