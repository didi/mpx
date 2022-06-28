import { isPlainObject } from '../helper/utils'
import { isRef } from '../observer/ref'
import { isReactive } from '../observer/reactive'

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
