import { isRef, isReactive, toRef } from '@mpxjs/core'
import { isFunction } from '@mpxjs/utils'
/**
 * * @description: all the props extracted are reactive
 * * @param: store
 * @return {*} store
 */
export function storeToRefs (store) {
  // return toRefs(store)
  let refs = {}
  const isNotNativeProps = prop => {
    return typeof prop === 'string' && prop[0] !== '$' && prop[0] !== '_'
  }
  for (let key in store) {
    const value = store[key]
    if (isNotNativeProps(key) && !isRef(value) && !isReactive(value) && !isFunction(value)) {
      refs[key] = toRef(store, key)
    }
  }
  return refs
}
