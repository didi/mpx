import { isReactive } from "../observer/reactive"
import { isRef, toRef } from "../observer/ref"

/**
 * @description: to make reactive object unreactive, and all the props extracted are reactive 
 * @param: store
 * @return {*} store
 */
export function storeToRefs(store) {
  const refs = {}
  for (const key in store) {
    const value = store[key]
    if (isRef(value) || isReactive(value)) {
      refs[key] = toRef(store, key)
    }
  }
  return refs
}