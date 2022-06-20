/* 
* export util functions
*/
import { isPlainObject } from '../helper/utils'
import { isRef } from '../observer/ref'
import { isReactive } from '../observer/reactive'

function mergeReactiveObjects(target, patchObj) {
  for(const key in patchObj) {
    // to exclude props on proto
    if (!patchObj.hasOwnProperty(key)) continue
    const curPatchProp = patchObj[key]
    const targetVal = target[key]

    let isTargetOwnKey = target.hasOwnProperty(key)

    if (
      isTargetOwnKey && 
      isPlainObject(targetVal) && 
      isPlainObject(curPatchProp) && 
      !isRef(curPatchProp) &&
      !isReactive(curPatchProp)
    ) {
      target[key] = mergeReactiveObjects(targetVal, curPatchProp)
    } else {
      target[key] = curPatchProp
    }
  }
  return target
}

function isComputed(obj) {
  return !!(isRef(obj) && (obj).effect)
}

export {
  mergeReactiveObjects,
  isComputed
}